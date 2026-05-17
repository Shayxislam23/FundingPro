import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { callAi, PROMPTS } from "@/lib/ai-gateway";

// POST /api/v1/eligibility/check
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { grantId, answers } = body;

    if (!answers || typeof answers !== "object") {
      return apiError("answers required", 400, "MISSING_FIELDS");
    }

    // Fetch grant if provided
    let grant = null;
    if (grantId) {
      grant = await prisma.grant.findUnique({
        where: { id: grantId },
        include: { donor: { select: { shortName: true } }, requirements: true },
      });
    }

    // Rule-based scoring (AI-ready structure)
    const { score, status, strengths, gaps, nextSteps } = computeEligibility(answers, grant);

    // Call AI gateway for narrative
    const prompt = PROMPTS["eligibility-review"](
      grant?.title ?? "Общий грант",
      JSON.stringify(sanitizeForAI(answers))
    );
    const aiResult = await callAi(prompt, { module: "eligibility-review", userId: authUser.userId });

    // Save EligibilityCheck
    const check = await prisma.eligibilityCheck.create({
      data: {
        userId: authUser.userId,
        grantId: grantId ?? null,
        answers,
        score,
        status: status as never,
        strengths,
        gaps,
        nextSteps,
      },
    });

    return apiSuccess({
      checkId: check.id,
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

function sanitizeForAI(answers: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment_id"];
  return Object.fromEntries(
    Object.entries(answers).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f)))
  );
}

type Grant = {
  eligibleTypes: string[];
  country: string[];
  requirements: { isRequired: boolean; description: string }[];
} | null;

function computeEligibility(answers: Record<string, unknown>, grant: Grant) {
  let score = 50;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  if (answers.orgType) {
    if (grant?.eligibleTypes.includes(String(answers.orgType))) {
      score += 15;
      strengths.push("Тип организации соответствует требованиям донора");
    } else if (grant) {
      score -= 20;
      gaps.push("Тип организации не входит в список допустимых");
    }
  }
  if (answers.country && grant?.country.includes(String(answers.country))) {
    score += 10;
    strengths.push("Страна деятельности соответствует географии гранта");
  }
  if (answers.hasRegistration === true || answers.hasRegistration === "true") {
    score += 10;
    strengths.push("Организация официально зарегистрирована");
  } else {
    score -= 10;
    gaps.push("Требуется официальная регистрация организации");
    nextSteps.push("Зарегистрируйте организацию в соответствующих органах");
  }
  if (answers.hasFinancialReport === true || answers.hasFinancialReport === "true") {
    score += 10;
    strengths.push("Финансовая отчётность в наличии");
  } else {
    gaps.push("Отсутствует финансовая отчётность");
    nextSteps.push("Подготовьте финансовый отчёт за последний год");
  }
  if (answers.previousGrantExperience === true || answers.previousGrantExperience === "true") {
    score += 5;
    strengths.push("Опыт работы с грантами");
  }

  if (nextSteps.length === 0) nextSteps.push("Подготовьте полный пакет документов", "Свяжитесь с консультантом FundingPro");

  const clampedScore = Math.max(0, Math.min(100, score));
  const status =
    clampedScore >= 70 ? "ELIGIBLE" : clampedScore >= 40 ? "PARTIALLY_ELIGIBLE" : "NOT_ELIGIBLE";

  return { score: clampedScore, status, strengths, gaps, nextSteps };
}
