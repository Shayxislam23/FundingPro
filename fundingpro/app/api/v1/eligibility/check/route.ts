export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureInternalUser } from "@/lib/db/users";
import { getGrantForEligibility, saveEligibilityCheck } from "@/lib/db/eligibility";
import { callAi, PROMPTS } from "@/lib/ai-gateway";
import { logAiRequest } from "@/lib/db/proposals";
import { computeEligibility, sanitizeForAI } from "@/lib/eligibility-score";
import { checkEligibilityLimit } from "@/lib/plan-limits";
import { trackServerEvent } from "@/lib/analytics-server";

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { grantId, answers } = body;

  if (!answers || typeof answers !== "object") {
    return apiError("answers required", 400, "MISSING_FIELDS");
  }

  await ensureInternalUser({
    email: authUser.email,
    provider: "clerk",
  }, authUser.accessToken);

  const limitCheck = await checkEligibilityLimit(authUser.accessToken);
  if (!limitCheck.allowed) {
    return apiError(limitCheck.message, 402, limitCheck.code);
  }

  let grant: { title: string; sectors: string[]; country_scope: string[] } | null = null;
  if (grantId) {
    const data = await getGrantForEligibility(grantId, authUser.accessToken);
    if (data) {
      grant = {
        title: String(data.title),
        sectors: (data.sectors as string[]) ?? [],
        country_scope: (data.country_scope as string[]) ?? [],
      };
    }
  }

  const { score, status, strengths, gaps, nextSteps } = computeEligibility(answers, grant);

  const prompt = PROMPTS["eligibility-review"](
    grant?.title ?? "Общий грант",
    JSON.stringify(sanitizeForAI(answers))
  );
  const aiResult = await callAi(prompt, { module: "eligibility-review", userId: authUser.userId });

  const aiRequestId = await logAiRequest(
    {
      requestType: "eligibility-review",
      model: aiResult.provider,
      outputTokens: aiResult.tokensUsed,
      redactionApplied: aiResult.redactionFields.length > 0,
    },
    authUser.accessToken
  );

  const checkId = await saveEligibilityCheck(
    {
      grantId: grantId ?? null,
      answers,
      score,
      status,
      strengths,
      gaps,
      nextSteps,
      aiRequestId,
    },
    authUser.accessToken
  );

  trackServerEvent("eligibility_run", {
    userId: authUser.userId,
    grantId: grantId ?? null,
    status,
    score,
  });

  return apiSuccess({
    checkId,
    score,
    status,
    strengths,
    gaps,
    nextSteps,
    // The score above is computed locally; when the AI provider is down we
    // degrade gracefully by omitting the narrative instead of shipping mock text.
    aiNarrative: aiResult.isMock ? null : aiResult.content,
    aiProvider: aiResult.provider,
    isMockAi: aiResult.isMock,
  });
});
