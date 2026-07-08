export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { ensureInternalUser } from "@/lib/db/users";
import { matchGrantsFromDatabase } from "@/lib/db/match-grants";
import { logAiRequest } from "@/lib/db/proposals";
import { callAi, PROMPTS } from "@/lib/ai-gateway";

type SafeMatchProfile = {
  sector?: string;
  country?: string;
  applicantType?: string;
};

export const POST = withActiveUser(async (req, authUser) => {
  if (!(await checkAiRateLimitAsync(authUser.userId))) {
    return apiError("Too many AI requests. Try again later.", 429, "RATE_LIMITED");
  }

  const body = await req.json();
  const { organizationProfile } = body;

  if (!organizationProfile || typeof organizationProfile !== "object") {
    return apiError("organizationProfile required", 400, "MISSING_FIELDS");
  }

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const safeProfile = sanitizeProfile(organizationProfile);
  const dbMatches = await matchGrantsFromDatabase(safeProfile, authUser.accessToken, 10);

  const profileJson = JSON.stringify(safeProfile);
  const prompt = PROMPTS["match-grants"](profileJson);
  const aiResult = await callAi(prompt, { module: "match-grants", userId: authUser.userId });

  const aiRequestId = await logAiRequest(
    {
      requestType: "match-grants",
      model: aiResult.provider,
      outputTokens: aiResult.tokensUsed,
      redactionApplied: aiResult.redactionFields.length > 0,
    },
    authUser.accessToken
  );

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

function sanitizeProfile(profile: Record<string, unknown>): SafeMatchProfile {
  const safeProfile: SafeMatchProfile = {};
  const sector = pickProfileString(profile, ["sector", "sectors"]);
  const country = pickProfileString(profile, ["country", "countryScope", "country_scope"]);
  const applicantType = pickProfileString(profile, [
    "applicantType",
    "applicant_type",
    "orgType",
    "org_type",
    "type",
  ]);

  if (sector) safeProfile.sector = sector;
  if (country) safeProfile.country = country;
  if (applicantType) safeProfile.applicantType = applicantType;

  return safeProfile;
}

function pickProfileString(profile: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = normalizeProfileString(profile[key]);
    if (value) return value;
  }
  return undefined;
}

function normalizeProfileString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 120) : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeProfileString(item);
      if (normalized) return normalized;
    }
  }

  return undefined;
}
