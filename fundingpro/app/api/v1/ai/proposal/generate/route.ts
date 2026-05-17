import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
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

    // AI DATA POLICY: redact personal identifiers before sending to AI
    const { redacted: safeIdea, fieldsFound } = redactPiiHelper(projectIdea);
    const hasPersonalData = fieldsFound.length > 0;

    // Generate each requested section (max 5 to prevent abuse)
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

    // Create ProposalProject + sections in DB
    const project = await prisma.proposalProject.create({
      data: {
        userId: authUser.userId,
        title: projectIdea.slice(0, 120),
        grantId: grantId ?? null,
        donorFormat,
        status: "DRAFT",
        sections: {
          create: Object.entries(sectionContents).map(([sectionType, content]) => ({
            sectionType,
            content,
            version: 1,
          })),
        },
      },
      include: { sections: true },
    });

    // Non-blocking redaction log if PII was detected
    if (hasPersonalData) {
      prisma.redactionLog.create({
        data: {
          aiRequestId: project.id,
          fieldType: fieldsFound.join(","),
          redacted: true,
        },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "ai_generation",
        entityType: "ProposalProject",
        entityId: project.id,
        metadata: { donorFormat, sectionCount: sections.length, isMock: lastIsMock },
      },
    });

    return apiSuccess({
      proposalId: project.id,
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
