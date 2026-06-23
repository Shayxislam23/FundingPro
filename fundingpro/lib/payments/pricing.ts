import { getUsdUzsRate } from "./config";

export function usdToUzs(amountUsd: number, rate = getUsdUzsRate()): number {
  return Math.round(amountUsd * rate);
}

export function uzsToTiyin(amountUzs: number): number {
  return Math.round(amountUzs * 100);
}

export function usdToTiyin(amountUsd: number, rate = getUsdUzsRate()): number {
  return uzsToTiyin(usdToUzs(amountUsd, rate));
}

export function tiyinToUzs(amountTiyin: number): number {
  return Math.round(amountTiyin / 100);
}
