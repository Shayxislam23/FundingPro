const DEFAULT_USD_UZS_RATE = 12800;

export function getUsdUzsRate(): number {
  const raw =
    typeof process !== "undefined" ? process.env.USD_UZS_RATE : undefined;
  const parsed = Number(raw ?? DEFAULT_USD_UZS_RATE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_UZS_RATE;
}
