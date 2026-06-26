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
  return convexPublicQuery(api.plans.list, {});
}

export function groupPlansByTarget(plans: PlanRow[]) {
  const ngo = plans.filter((p) => p.targetType === "NGO");
  const business = plans.filter(
    (p) => p.targetType === "BUSINESS" || p.targetType === "ENTERPRISE"
  );
  return { ngo, business };
}
