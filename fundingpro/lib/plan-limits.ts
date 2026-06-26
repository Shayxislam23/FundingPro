import { getUserSubscription } from "@/lib/db/users";

export type PlanUsageLimits = {
  eligibilityChecks: number | null;
  aiProposals: number | null;
};

export type PlanUsageSnapshot = {
  planId: string | null;
  limits: PlanUsageLimits;
  used: {
    eligibilityChecks: number;
    aiProposals: number;
  };
};

const FREE_LIMITS: PlanUsageLimits = {
  eligibilityChecks: 2,
  aiProposals: 1,
};

const PLAN_LIMITS: Record<string, PlanUsageLimits> = {
  "plan-ngo-basic": { eligibilityChecks: 5, aiProposals: 2 },
  "plan-ngo-pro": { eligibilityChecks: null, aiProposals: 10 },
  "plan-ngo-consulting": { eligibilityChecks: null, aiProposals: null },
  "plan-business-starter": { eligibilityChecks: null, aiProposals: null },
  "plan-business-pro": { eligibilityChecks: null, aiProposals: null },
  "plan-enterprise": { eligibilityChecks: null, aiProposals: null },
};

export function limitsForPlanId(planId: string | null | undefined): PlanUsageLimits {
  if (!planId) return FREE_LIMITS;
  return PLAN_LIMITS[planId] ?? FREE_LIMITS;
}

async function countMonthlyEligibilityChecks(accessToken: string): Promise<number> {
  const { convexQuery, api } = await import("@/lib/convex-server");
  const usage = await convexQuery(api.planUsage.monthlyUsage, {}, accessToken);
  return usage.eligibilityChecks;
}

async function countMonthlyAiProposals(accessToken: string): Promise<number> {
  const { convexQuery, api } = await import("@/lib/convex-server");
  const usage = await convexQuery(api.planUsage.monthlyUsage, {}, accessToken);
  return usage.aiProposals;
}

export async function getPlanUsage(accessToken: string): Promise<PlanUsageSnapshot> {
  const subscription = await getUserSubscription(accessToken);
  const planId = subscription?.plan?.id ?? null;
  const limits = limitsForPlanId(planId);
  const [eligibilityChecks, aiProposals] = await Promise.all([
    countMonthlyEligibilityChecks(accessToken),
    countMonthlyAiProposals(accessToken),
  ]);

  return {
    planId,
    limits,
    used: { eligibilityChecks, aiProposals },
  };
}

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; code: "PLAN_LIMIT_ELIGIBILITY" | "PLAN_LIMIT_PROPOSALS"; message: string };

export async function checkEligibilityLimit(accessToken: string): Promise<LimitCheckResult> {
  const usage = await getPlanUsage(accessToken);
  const max = usage.limits.eligibilityChecks;
  if (max !== null && usage.used.eligibilityChecks >= max) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_ELIGIBILITY",
      message: `Лимит проверок соответствия (${max}/мес) исчерпан. Обновите тариф в разделе «Подписка».`,
    };
  }
  return { allowed: true };
}

export async function checkProposalLimit(accessToken: string): Promise<LimitCheckResult> {
  const usage = await getPlanUsage(accessToken);
  const max = usage.limits.aiProposals;
  if (max !== null && usage.used.aiProposals >= max) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_PROPOSALS",
      message: `Лимит AI-предложений (${max}/мес) исчерпан. Обновите тариф в разделе «Подписка».`,
    };
  }
  return { allowed: true };
}
