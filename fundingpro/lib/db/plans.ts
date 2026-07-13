import { api, convexPublicQuery } from "@/lib/convex-server";

export type PlanRow = {
  id: string;
  name: string;
  nameRu: string;
  targetType: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
};

export async function listPlans(): Promise<PlanRow[]> {
  try {
    return await convexPublicQuery(api.plans.list, {});
  } catch (err) {
    const { isSeedFallbackEnabled, seedFallbackPlans } = await import("./catalog-fallback");
    if (isSeedFallbackEnabled()) return seedFallbackPlans();
    throw err;
  }
}

function normalizeTargetType(targetType: string): string {
  return targetType.trim().toUpperCase();
}

/** v1 public surface: individuals only (физлица). */
export function isIndividualPlan(plan: Pick<PlanRow, "targetType">): boolean {
  return normalizeTargetType(plan.targetType) === "INDIVIDUAL";
}

/** Plans shown on landing /pricing — excludes deferred NGO/business tiers. */
export function listIndividualPlans(plans: PlanRow[]): PlanRow[] {
  return plans.filter(isIndividualPlan);
}

export function groupPlansByTarget(plans: PlanRow[]) {
  const individual = plans.filter((p) => normalizeTargetType(p.targetType) === "INDIVIDUAL");
  const ngo = plans.filter((p) => normalizeTargetType(p.targetType) === "NGO");
  const business = plans.filter((p) => {
    const t = normalizeTargetType(p.targetType);
    return t === "BUSINESS" || t === "ENTERPRISE";
  });
  return { individual, ngo, business };
}
