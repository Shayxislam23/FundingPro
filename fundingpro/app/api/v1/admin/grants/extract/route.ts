export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { AiUnavailableError, callAi, PROMPTS } from "@/lib/ai-gateway";
import { parseExtractedGrant } from "@/lib/grant-extraction";
import { logAiRequest } from "@/lib/db/proposals";

const MIN_ANNOUNCEMENT_LENGTH = 80;
const MAX_ANNOUNCEMENT_LENGTH = 30_000;

/**
 * POST /api/v1/admin/grants/extract
 * Admin intake tool: paste a raw grant announcement, receive a structured
 * draft to prefill the grants CMS form. Nothing is saved to the catalog here.
 */
export const POST = withAdmin(async (req, admin) => {
  if (!(await checkAiRateLimitAsync(admin.userId))) {
    return apiError("Too many AI requests. Try again later.", 429, "RATE_LIMITED");
  }

  const body = await req.json();
  const announcementText = typeof body.announcementText === "string" ? body.announcementText.trim() : "";

  if (announcementText.length < MIN_ANNOUNCEMENT_LENGTH) {
    return apiError(
      `announcementText required (min ${MIN_ANNOUNCEMENT_LENGTH} chars)`,
      400,
      "MISSING_FIELDS"
    );
  }
  if (announcementText.length > MAX_ANNOUNCEMENT_LENGTH) {
    return apiError(
      `announcementText too long (max ${MAX_ANNOUNCEMENT_LENGTH} chars)`,
      400,
      "INPUT_TOO_LONG"
    );
  }

  const prompt = PROMPTS["grant-extract"](announcementText);
  let aiResult;
  try {
    // Always strict: a mock response is useless for data entry.
    aiResult = await callAi(prompt, {
      module: "grant-extract",
      userId: admin.userId,
      strict: true,
    });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return apiError("AI-сервис временно недоступен. Попробуйте позже.", 503, "AI_UNAVAILABLE");
    }
    throw err;
  }

  const aiRequestId = await logAiRequest(
    {
      requestType: "grant-extract",
      model: aiResult.provider,
      outputTokens: aiResult.tokensUsed,
      redactionApplied: aiResult.redactionFields.length > 0,
    },
    admin.accessToken
  );

  const parsed = parseExtractedGrant(aiResult.content);
  if (!parsed.ok) {
    return apiError(`AI output could not be parsed (${parsed.error})`, 422, "EXTRACTION_FAILED");
  }

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_grant_extract",
    entityType: "ai_request",
    entityId: aiRequestId,
    metadata: { title: parsed.draft.title, donorName: parsed.draft.donorName ?? "" },
  });

  return apiSuccess({
    draft: parsed.draft,
    isDraft: true,
    aiProvider: aiResult.provider,
    aiRequestId,
  });
});
