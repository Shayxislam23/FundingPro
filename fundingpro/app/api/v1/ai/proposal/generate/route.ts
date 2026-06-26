export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { ensureInternalUser } from "@/lib/db/users";
import { logAiRequest, saveProposalProject } from "@/lib/db/proposals";
import { callAi, PROMPTS, redactPii as redactPiiHelper } from "@/lib/ai-gateway";
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

  const sectionContents: Record<string, string> = {};
  let lastProvider = "mock";
  let lastIsMock = true;
  let totalTokens = 0;

  for (const sectionType of allowedSections) {
    const prompt = PROMPTS["proposal-generate"](sectionType, donorFormat, safeIdea);
    const result = await callAi(prompt, { module: "proposal-generate", userId: authUser.userId });
    const validation = validateProposalContent(result.content);
    if (!validation.valid) {
      return apiError(`AI output invalid for section ${sectionType}`, 502, "AI_OUTPUT_INVALID");
    }
    sectionContents[sectionType] = result.content;
    lastProvider = result.provider;
    lastIsMock = result.isMock;
    totalTokens += result.tokensUsed ?? 0;
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
