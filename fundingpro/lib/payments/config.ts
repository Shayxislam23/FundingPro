export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true";
}

export function getPaymentProvider(): string {
  return process.env.PAYMENT_PROVIDER ?? "uzum";
}

export function getPaymentIntegrationStatus(): string {
  if (!isPaymentsEnabled()) {
    return process.env.PAYMENT_INTEGRATION_STATUS ?? "pending_integration";
  }
  if (!isUzumConfigured()) {
    return "configured_partial";
  }
  return "active";
}

export function getUzumMerchantConfig() {
  return {
    serviceId: process.env.UZUM_MERCHANT_SERVICE_ID ?? "",
    login: process.env.UZUM_MERCHANT_LOGIN ?? "",
    password: process.env.UZUM_MERCHANT_PASSWORD ?? "",
  };
}

export function getUzumCheckoutConfig() {
  return {
    baseUrl: (process.env.UZUM_CHECKOUT_BASE_URL ?? "https://api.uzumbank.uz").replace(/\/$/, ""),
    terminalId: process.env.UZUM_CHECKOUT_TERMINAL_ID ?? "",
    secret: process.env.UZUM_CHECKOUT_SECRET ?? "",
    returnUrl:
      process.env.UZUM_CHECKOUT_RETURN_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/subscription/return`,
  };
}

export function isUzumMerchantConfigured(): boolean {
  const c = getUzumMerchantConfig();
  return !!(c.serviceId && c.login && c.password);
}

export function isUzumCheckoutConfigured(): boolean {
  const c = getUzumCheckoutConfig();
  return !!(c.terminalId && c.secret);
}

export function isUzumConfigured(): boolean {
  return isUzumMerchantConfigured() || isUzumCheckoutConfigured();
}

export function getUsdUzsRate(): number {
  const n = Number(process.env.USD_UZS_RATE ?? "12800");
  return Number.isFinite(n) && n > 0 ? n : 12800;
}

export function buildUzumAppDeepLink(paymentId: string, amountTiyin: number): string | null {
  const { serviceId } = getUzumMerchantConfig();
  if (!serviceId) return null;
  const params = new URLSearchParams({
    serviceId,
    order_id: paymentId,
    amount: String(amountTiyin),
  });
  return `https://www.apelsin.uz/open-service?${params.toString()}`;
}
