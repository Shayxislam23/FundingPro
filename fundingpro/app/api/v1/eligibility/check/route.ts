import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// POST /api/v1/eligibility/check
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { grantId, answers } = body;

    if (!answers || typeof answers !== "object") {
      return apiError("answers required", 400, "MISSING_FIELDS");
    }

    // AI DATA POLICY: sanitize answers before sending to AI
    // Remove any personal data fields that may have been accidentally included
    const sanitizedAnswers = sanitizeForAI(answers);

    // TODO: call AI Gateway with sanitized answers + grant requirements
    // TODO: log AIRequest record
    // TODO: save EligibilityCheck result
    // TODO: write audit log

    return apiSuccess({
      checkId: "TODO_CHECK_ID",
      score: 0,
      status: "PARTIALLY_ELIGIBLE",
      strengths: [],
      gaps: [],
      nextSteps: [],
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// AI DATA POLICY: never send personal data to external AI providers
function sanitizeForAI(answers: Record<string, unknown>): Record<string, unknown> {
  const forbiddenKeys = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment_id", "transaction_id"];
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    const isPersonal = forbiddenKeys.some((fk) => k.toLowerCase().includes(fk));
    if (!isPersonal) {
      sanitized[k] = v;
    }
  }
  return sanitized;
}
