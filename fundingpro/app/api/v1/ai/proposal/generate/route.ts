export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { ensureInternalUser } from "@/lib/db/users";
import { logAiRequest, saveProposalProject } from "@/lib/db/proposals";
import { AiUnavailableError, callAi, PROMPTS, redactPii as redactPiiHelper } from "@/lib/ai-gateway";
import { validateProposalContent } from "@/lib/ai-validation";
import { filterProposalSections } from "@/lib/proposal-sections";
import { checkProposalLimit } from "@/lib/plan-limits";

export const POST = withActiveUser(async (req, authUser) => {
  if (!(await checkAiRateLimitAsync(authUser.userId))) {
    return apiError("Too many AI requests. Try again later.", 429, "RATE_LIMITED");
  }

  const body = await req.json();
  const { projectIdea, donorFormat, sections, grantId, confirmSave } = body;

  const allowedSections = filterProposalSections(sections);
  if (!projectIdea || !donorFormat || allowedSections.length === 0) {
    return apiError("projectIdea, donorFormat, and valid sections required", 400, "MISSING_FIELDS");
  }
  if (projectIdea.length > 10000) {
    return apiError("projectIdea too long (max 10000 chars)", 400, "INPUT_TOO_LONG");
  }

  await ensureInternalUser({
    email: authUser.email,
    provider: "clerk",
  }, authUser.accessToken);

  if (confirmSave !== false) {
    const limitCheck = await checkProposalLimit(authUser.accessToken);
    if (!limitCheck.allowed) {
      return apiError(limitCheck.message, 402, limitCheck.code);
    }
  }

  const { redacted: safeIdea, fieldsFound } = redactPiiHelper(projectIdea);

  // In production a provider outage must fail the request before any quota
  // is consumed — paying users must never receive mock text as a proposal.
  const strictAi = process.env.NODE_ENV === "production";

  type SectionOutcome =
    | { sectionType: string; ok: true; content: string; provider: string; isMock: boolean; tokensUsed: number }
    | { sectionType: string; ok: false; kind: "unavailable" | "invalid" };

  // Generate every section concurrently instead of one AI round-trip at a
  // time — with 5+ sections the sequential version risked serverless
  // function timeouts. Errors are still resolved in section order below so
  // the response is deterministic regardless of which call finishes first.
  const outcomes = await Promise.all(
    allowedSections.map(async (sectionType): Promise<SectionOutcome> => {
      const prompt = PROMPTS["proposal-generate"](sectionType, donorFormat, safeIdea);
      let result;
      try {
        result = await callAi(prompt, {
          module: "proposal-generate",
          userId: authUser.userId,
          strict: strictAi,
        });
      } catch (err) {
        if (err instanceof AiUnavailableError) {
          return { sectionType, ok: false, kind: "unavailable" };
        }
        throw err;
      }
      const validation = validateProposalContent(result.content);
      if (!validation.valid) {
        return { sectionType, ok: false, kind: "invalid" };
      }
      return {
        sectionType,
        ok: true,
        content: result.content,
        provider: result.provider,
        isMock: result.isMock,
        tokensUsed: result.tokensUsed ?? 0,
      };
    })
  );

  for (const outcome of outcomes) {
    if (outcome.ok) continue;
    if (outcome.kind === "unavailable") {
      return apiError(
        "AI-сервис временно недоступен. Попробуйте позже — лимит не израсходован.",
        503,
        "AI_UNAVAILABLE"
      );
    }
    return apiError(`AI output invalid for section ${outcome.sectionType}`, 502, "AI_OUTPUT_INVALID");
  }

  const sectionContents: Record<string, string> = {};
  let lastProvider = "mock";
  let lastIsMock = true;
  let totalTokens = 0;
  for (const outcome of outcomes) {
    if (!outcome.ok) continue;
    sectionContents[outcome.sectionType] = outcome.content;
    lastProvider = outcome.provider;
    lastIsMock = outcome.isMock;
    totalTokens += outcome.tokensUsed;
  }

  const aiRequestId = await logAiRequest(
    {
      requestType: "proposal-generate",
      model: lastProvider,
      outputTokens: totalTokens,
      redactionApplied: fieldsFound.length > 0,
    },
    authUser.accessToken
  );

  let proposalId = crypto.randomUUID();

  if (confirmSave !== false) {
    proposalId = await saveProposalProject(
      {
        title: projectIdea.slice(0, 120),
        grantId: grantId ?? undefined,
        donorFormat,
        sections: sectionContents,
      },
      authUser.accessToken
    );
  }

  await writeAuditLog({
    userId: authUser.userId,
    action: "ai_proposal_generate",
    entityType: "proposal",
    entityId: proposalId,
    metadata: {
      donorFormat,
      sectionCount: allowedSections.length,
      isMock: lastIsMock,
      aiRequestId,
      saved: confirmSave !== false,
    },
  });

  return apiSuccess(
    {
      proposalId,
      sections: sectionContents,
      isDraft: true,
      saved: confirmSave !== false,
      disclaimer:
        "Это черновик, сгенерированный AI. Требует профессиональной проверки перед подачей. AI-generated drafts require human review before submission.",
      aiProvider: lastProvider,
      isMockAi: lastIsMock,
      aiRequestId,
    },
    201
  );
});
