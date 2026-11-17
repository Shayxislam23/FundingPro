export type LandingPlan = {
  id: string;
  nameRu: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
};

/** Individuals-first featured tiers (legacy slugs; targetType is INDIVIDUAL). */
export const FEATURED_PLAN_IDS = ["plan-ngo-basic", "plan-ngo-pro"];

export function formatGrantCountLabel(grantTotal: number | null): string {
  if (grantTotal !== null && grantTotal > 0) {
    return grantTotal >= 1000 ? `${Math.floor(grantTotal / 100) * 100}+` : String(grantTotal);
  }
  // While the live total is loading (or unavailable) show a neutral
  // placeholder — never a fabricated count.
  return "—";
}
