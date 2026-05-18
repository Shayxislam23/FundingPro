export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser, writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { callAi, PROMPTS, redactPii as redactPiiHelper } from "@/lib/ai-gateway";

// POST /api/v1/ai/proposal/generate
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { projectIdea, donorFormat, sections, grantId } = body;

    if (!projectIdea || !donorFormat || !sections?.length) {
      return apiError("projectIdea, donorFormat, sections required", 400, "MISSING_FIELDS");
    }
    if (projectIdea.length > 10000) {
      return apiError("projectIdea too long (max 10000 chars)", 400, "INPUT_TOO_LONG");
    }

    const { redacted: safeIdea } = redactPiiHelper(projectIdea);

    const sectionContents: Record<string, string> = {};
    let lastProvider = "mock";
    let lastIsMock = true;

    for (const sectionType of sections.slice(0, 5)) {
      const prompt = PROMPTS["proposal-generate"](sectionType, donorFormat, safeIdea);
      const result = await callAi(prompt, { module: "proposal-generate", userId: authUser.userId });
      sectionContents[sectionType] = result.content;
      lastProvider = result.provider;
      lastIsMock = result.isMock;
    }

    // Save to Supabase proposals table if it exists
    const supabase = createSupabaseAdmin();
    const proposalId = crypto.randomUUID();

    supabase.from("proposals").insert({
      id: proposalId,
      user_id: authUser.userId,
      grant_id: grantId ?? null,
      title: projectIdea.slice(0, 120),
      status: "draft",
      sections_json: sectionContents,
    }).then(() => {}, () => {}); // non-blocking — table may not exist yet

    await writeAuditLog({
      userId: authUser.userId,
      action: "ai_proposal_generate",
      entityType: "proposal",
      entityId: proposalId,
      metadata: { donorFormat, sectionCount: sections.length, isMock: lastIsMock },
    });

    return apiSuccess({
      proposalId,
      sections: sectionContents,
      isDraft: true,
      disclaimer: "Это черновик, сгенерированный AI. Требует профессиональной проверки перед подачей.",
      aiProvider: lastProvider,
      isMockAi: lastIsMock,
    }, 201);
  } catch (err) {
    console.error("POST /ai/proposal/generate error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
