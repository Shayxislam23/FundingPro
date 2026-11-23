import type { RevenueShareSplit, RevenueShareTier } from "./types";

/** Configurable tiers — persisted override via Convex settings key `partner_revenue_share_tiers`. */
export const DEFAULT_REVENUE_SHARE_TIERS: RevenueShareTier[] = [
  { minTransactions: 0, maxTransactions: 500, partnerPercent: 30, fundingProPercent: 70 },
  { minTransactions: 500, maxTransactions: 1500, partnerPercent: 28, fundingProPercent: 72 },
  { minTransactions: 1500, maxTransactions: 5000, partnerPercent: 25, fundingProPercent: 75 },
  { minTransactions: 5000, maxTransactions: 10000, partnerPercent: 22, fundingProPercent: 78 },
  { minTransactions: 10000, maxTransactions: null, partnerPercent: 20, fundingProPercent: 80 },
];

export function parseRevenueShareTiersJson(raw: string | null | undefined): RevenueShareTier[] {
  if (!raw) return DEFAULT_REVENUE_SHARE_TIERS;
  try {
    const parsed = JSON.parse(raw) as RevenueShareTier[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_REVENUE_SHARE_TIERS;
    }
    return parsed;
  } catch {
    return DEFAULT_REVENUE_SHARE_TIERS;
  }
}

export function resolveRevenueShare(
  monthlyCompletedTransactions: number,
  tiers: RevenueShareTier[] = DEFAULT_REVENUE_SHARE_TIERS
): RevenueShareSplit {
  const count = Math.max(0, monthlyCompletedTransactions);
  const tier =
    tiers.find((row) => {
      const aboveMin = count >= row.minTransactions;
      const belowMax = row.maxTransactions === null || count < row.maxTransactions;
      return aboveMin && belowMax;
    }) ?? tiers[tiers.length - 1]!;

  const maxLabel =
    tier.maxTransactions === null ? `${tier.minTransactions}+` : `${tier.minTransactions}–${tier.maxTransactions}`;

  return {
    partnerPercent: tier.partnerPercent,
    fundingProPercent: tier.fundingProPercent,
    tierLabel: maxLabel,
    monthlyCompletedTransactions: count,
  };
}

export function currentYearMonth(now = Date.now()): string {
  const d = new Date(now);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}`;
}
