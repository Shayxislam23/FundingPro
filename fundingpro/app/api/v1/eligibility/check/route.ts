import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
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

    const supabase = createSupabaseAdmin();

    // Fetch grant if provided
    let grant: { title: string; sectors: string[]; country_scope: string[] } | null = null;
    if (grantId) {
      const { data } = await supabase
        .from("grants")
        .select("title, sectors, country_scope")
        .eq("id", grantId)
        .single();
      grant = data;
    }

    const { score, status, strengths, gaps, nextSteps } = computeEligibility(answers, grant);

    const prompt = PROMPTS["eligibility-review"](
      grant?.title ?? "Общий грант",
      JSON.stringify(sanitizeForAI(answers))
    );
    const aiResult = await callAi(prompt, { module: "eligibility-review", userId: authUser.userId });

    // Save to eligibility_checks table (if it exists in Supabase)
    let checkId = crypto.randomUUID();
    try {
      const { data: check } = await supabase
        .from("eligibility_checks")
        .insert({
          user_id: authUser.userId,
          grant_id: grantId ?? null,
          answers,
          score,
          status,
          strengths,
          gaps,
          next_steps: nextSteps,
        })
        .select("id")
        .single();
      if (check?.id) checkId = check.id;
    } catch { /* table may not exist yet */ }

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

function sanitizeForAI(answers: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment_id"];
  return Object.fromEntries(
    Object.entries(answers).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f)))
  );
}

function computeEligibility(
  answers: Record<string, unknown>,
  grant: { sectors: string[]; country_scope: string[] } | null
) {
  let score = 50;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  const orgType = String(answers.org_type ?? "");
  if (orgType.includes("НКО")) { score += 15; strengths.push("НКО — приоритетный тип для большинства доноров"); }
  else if (orgType.includes("ООО") || orgType.includes("АО")) { score += 5; strengths.push("Юридическое лицо зарегистрировано"); }
  else if (orgType.includes("физлицо")) { score -= 15; gaps.push("Физические лица имеют ограниченный доступ к грантам"); }

  const experience = String(answers.experience ?? "");
  if (experience.includes("3 лет")) { score += 20; strengths.push("Более 3 лет опыта в секторе"); }
  else if (experience.includes("1–3")) { score += 10; strengths.push("1–3 года опыта"); }
  else if (experience.includes("Менее")) { score -= 5; gaps.push("Мало опыта — рекомендуется начать с малых грантов"); }
  else if (experience.includes("Нет")) { score -= 15; gaps.push("Нет опыта реализации проектов"); nextSteps.push("Начните с малых грантов или партнёрских проектов"); }

  const budget = String(answers.budget ?? "");
  if (budget.includes("международные")) { score += 15; strengths.push("Опыт управления международными грантами"); }
  else if (budget.includes("местные")) { score += 8; strengths.push("Опыт управления местными грантами"); }
  else if (budget.includes("Нет")) { score -= 10; gaps.push("Нет опыта управления грантовым бюджетом"); nextSteps.push("Пройдите обучение по финансовому управлению грантами"); }

  const documents = String(answers.documents ?? "");
  if (documents.includes("готовы")) { score += 10; strengths.push("Учредительные документы готовы"); }
  else if (documents.includes("Большинство")) { score += 5; }
  else if (documents.includes("Частично")) { score -= 5; gaps.push("Неполный пакет документов"); nextSteps.push("Подготовьте полный пакет учредительных документов"); }
  else if (documents.includes("Нет")) { score -= 20; gaps.push("Отсутствуют учредительные документы"); nextSteps.push("Срочно подготовьте все учредительные документы"); }

  const partners = String(answers.partners ?? "");
  if (partners.includes("несколько")) { score += 10; strengths.push("Сеть местных партнёров"); }
  else if (partners.includes("Один")) { score += 5; strengths.push("Есть местный партнёр"); }
  else if (partners.includes("Нет")) { score -= 5; gaps.push("Нет партнёров-рекомендателей"); nextSteps.push("Найдите местных партнёров или рекомендателей"); }

  if (nextSteps.length === 0) nextSteps.push("Подготовьте полный пакет документов", "Свяжитесь с консультантом FundingPro");

  const clampedScore = Math.max(0, Math.min(100, score));
  const status =
    clampedScore >= 70 ? "ELIGIBLE" : clampedScore >= 40 ? "PARTIALLY_ELIGIBLE" : "NOT_ELIGIBLE";

  return { score: clampedScore, status, strengths, gaps, nextSteps };
}
