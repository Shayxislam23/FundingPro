export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getGrantForEligibility, saveEligibilityCheck } from "@/lib/db/eligibility";
import { callAi, PROMPTS } from "@/lib/ai-gateway";
import { logAiRequest } from "@/lib/db/proposals";
import { computeEligibility, sanitizeForAI } from "@/lib/eligibility-score";
import { checkEligibilityLimit } from "@/lib/plan-limits";

// POST /api/v1/eligibility/check
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const { grantId, answers } = body;

    if (!answers || typeof answers !== "object") {
      return apiError("answers required", 400, "MISSING_FIELDS");
    }

    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    const limitCheck = await checkEligibilityLimit(authUser.userId);
    if (!limitCheck.allowed) {
      return apiError(limitCheck.message, 402, limitCheck.code);
    }

    let grant: { title: string; sectors: string[]; country_scope: string[] } | null = null;
    if (grantId) {
      const data = await getGrantForEligibility(grantId);
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

    const aiRequestId = await logAiRequest({
      userId: authUser.userId,
      requestType: "eligibility-review",
      model: aiResult.provider,
      outputTokens: aiResult.tokensUsed,
      redactionApplied: aiResult.redactionFields.length > 0,
    });

    const checkId = await saveEligibilityCheck({
      userId: authUser.userId,
      grantId: grantId ?? null,
      answers,
      score,
      status,
      strengths,
      gaps,
      nextSteps,
      aiRequestId,
    });

    return apiSuccess({
      checkId,
      score,
      status,
      strengths,
      gaps,
      nextSteps,
      aiNarrative: aiResult.content,
      aiProvider: aiResult.provider,
      isMockAi: aiResult.isMock,
    });
  } catch (err) {
    console.error("eligibility/check error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
