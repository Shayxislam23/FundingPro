/**
 * What FundingPro sells today. Prices that live in the database (subscriptions,
 * Lab cohorts) stay authoritative there; this is the public storefront copy.
 */
export const LAB_PRICE_UZS = 150_000;

export const SUCCESS_FEE_RANGE = "2–5%";

/** Deterministic (same on server and client): "150 000 сум" with non-breaking spaces. */
export function formatUzs(amount: number): string {
  const digits = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${digits}\u00A0сум`;
}
