export function formatPlanPrice(priceUsd: number): string {
  return priceUsd >= 500 ? `$${priceUsd}+` : `$${priceUsd}`;
}

export function formatPlanPriceUzs(priceUzs: number): string {
  if (!priceUzs || priceUzs <= 0) return "";
  return `${priceUzs.toLocaleString("ru-RU")} сум`;
}

export function formatPlanPriceDisplay(priceUzs: number, priceUsd: number) {
  const uzs = formatPlanPriceUzs(priceUzs);
  const usd = formatPlanPrice(priceUsd);
  return {
    primary: uzs || usd,
    secondary: uzs ? `≈ ${usd} справочно` : "",
    uzs,
    usd,
  };
}
