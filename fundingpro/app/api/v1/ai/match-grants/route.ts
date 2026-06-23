export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { ensureInternalUser } from "@/lib/db/users";
import { matchGrantsFromDatabase } from "@/lib/db/match-grants";
import { logAiRequest } from "@/lib/db/proposals";
import { callAi, PROMPTS } from "@/lib/ai-gateway";

export const POST = withActiveUser(async (req, authUser) => {
  if (!(await checkAiRateLimitAsync(authUser.userId))) {
    return apiError("Too many AI requests. Try again later.", 429, "RATE_LIMITED");
  }

  const body = await req.json();
  const { organizationProfile } = body;

  if (!organizationProfile || typeof organizationProfile !== "object") {
    return apiError("organizationProfile required", 400, "MISSING_FIELDS");
  }

  await ensureInternalUser({
    supabaseId: authUser.supabaseId,
    email: authUser.email,
    provider: "supabase_email",
  });

  const safeProfile = sanitizeProfile(organizationProfile);
  const dbMatches = await matchGrantsFromDatabase(safeProfile, 10);

  const profileJson = JSON.stringify(safeProfile);
  const prompt = PROMPTS["match-grants"](profileJson);
  const aiResult = await callAi(prompt, { module: "match-grants", userId: authUser.userId });

  const aiRequestId = await logAiRequest({
    userId: authUser.userId,
    requestType: "match-grants",
    model: aiResult.provider,
    outputTokens: aiResult.tokensUsed,
    redactionApplied: aiResult.redactionFields.length > 0,
  });

  await writeAuditLog({
    userId: authUser.userId,
    action: "ai_match_grants",
    entityType: "ai_request",
    entityId: aiRequestId,
    metadata: { matchCount: dbMatches.length, isMock: aiResult.isMock },
  });

  let aiMatches: { grantId: string; score: number; reason: string }[] = [];
  try {
    const parsed = JSON.parse(aiResult.content);
    if (Array.isArray(parsed)) aiMatches = parsed;
  } catch {
    // non-JSON AI response — use DB matches only
  }

  const matches =
    dbMatches.length > 0
      ? dbMatches.map((m) => ({
          grantId: m.grantId,
          title: m.titleRu ?? m.title,
          score: m.score,
          reason: m.reason,
          donorName: m.donorName,
          deadline: m.deadline,
        }))
      : aiMatches;

  return apiSuccess({
    matches,
    source: dbMatches.length > 0 ? "database" : aiMatches.length > 0 ? "ai" : "none",
    aiNarrative: aiResult.isMock ? null : aiResult.content,
    aiProvider: aiResult.provider,
    isMockAi: aiResult.isMock,
    aiRequestId,
    generatedAt: new Date().toISOString(),
  });
});

function sanitizeProfile(profile: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment"];
  return Object.fromEntries(
    Object.entries(profile).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f)))
  );
}
