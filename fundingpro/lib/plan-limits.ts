import { withDatabase } from "@/lib/db/runtime";
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

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function limitsForPlanId(planId: string | null | undefined): PlanUsageLimits {
  if (!planId) return FREE_LIMITS;
  return PLAN_LIMITS[planId] ?? FREE_LIMITS;
}

async function countMonthlyEligibilityChecks(userId: string): Promise<number> {
  const since = startOfCurrentMonth().toISOString();
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM eligibility_checks
         WHERE user_id = $1::uuid AND created_at >= $2::timestamptz`,
        [userId, since]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("eligibility_checks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
      return count ?? 0;
    }
  );
}

async function countMonthlyAiProposals(userId: string): Promise<number> {
  const since = startOfCurrentMonth().toISOString();
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM proposal_projects
         WHERE user_id = $1::uuid AND created_at >= $2::timestamptz`,
        [userId, since]
      );
      return Number(result.rows[0]?.total ?? 0);
    },
    async (supabase) => {
      const { count } = await supabase
        .from("proposal_projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
      return count ?? 0;
    }
  );
}

export async function getPlanUsage(userId: string): Promise<PlanUsageSnapshot> {
  const subscription = await getUserSubscription(userId);
  const planId = subscription?.plan?.id ?? null;
  const limits = limitsForPlanId(planId);
  const [eligibilityChecks, aiProposals] = await Promise.all([
    countMonthlyEligibilityChecks(userId),
    countMonthlyAiProposals(userId),
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

export async function checkEligibilityLimit(userId: string): Promise<LimitCheckResult> {
  const usage = await getPlanUsage(userId);
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

export async function checkProposalLimit(userId: string): Promise<LimitCheckResult> {
  const usage = await getPlanUsage(userId);
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
