import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// POST /api/v1/ai/proposal/generate
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { projectIdea, donorFormat, sections, grantId } = body;

    if (!projectIdea || !donorFormat || !sections?.length) {
      return apiError("projectIdea, donorFormat, sections required", 400, "MISSING_FIELDS");
    }

    // AI DATA POLICY CHECKS:
    // 1. Redact personal data from projectIdea before sending to AI
    // 2. Never guarantee grant approval
    // 3. Never fabricate donor requirements
    // 4. Mark output as draft requiring human review

    const redactedIdea = redactPersonalData(projectIdea);

    // TODO: check user subscription for AI generation quota
    // TODO: call AI Gateway (provider abstraction: OpenAI or Claude)
    // TODO: validate output schema
    // TODO: log AIRequest record with token usage
    // TODO: log RedactionLog if personal data was detected
    // TODO: write audit log: action="ai_generation"

    return apiSuccess({
      proposalId: "TODO_PROPOSAL_ID",
      sections: {},
      isDraft: true, // Always mark as draft
      disclaimer: "Это черновик, сгенерированный AI. Требует профессиональной проверки перед подачей.",
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// AI DATA POLICY: strip personal identifiers before sending to AI provider
function redactPersonalData(text: string): string {
  // TODO: implement proper NLP-based redaction
  // Placeholder: strip obvious patterns
  return text
    .replace(/\+?[\d\s\-()]{10,}/g, "[PHONE]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g, "[EMAIL]")
    .replace(/\d{14}/g, "[PINFL]"); // Uzbek PINFL is 14 digits
}
