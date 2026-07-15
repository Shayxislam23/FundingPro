import type { PaymentProviderId } from "./types";

const ALL_PROVIDERS: PaymentProviderId[] = ["uzum", "payme", "click"];

export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true";
}

export function getPaymentProvider(): string {
  return process.env.PAYMENT_PROVIDER ?? "uzum";
}

export function getEnabledPaymentProviders(): PaymentProviderId[] {
  if (!isPaymentsEnabled()) return [];
  const raw = process.env.PAYMENT_PROVIDERS ?? process.env.PAYMENT_PROVIDER ?? "uzum";
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PaymentProviderId => ALL_PROVIDERS.includes(s as PaymentProviderId));
  return ids.length > 0 ? ids : ["uzum"];
}

export function getPaymentIntegrationStatus(): string {
  if (!isPaymentsEnabled()) {
    return process.env.PAYMENT_INTEGRATION_STATUS ?? "pending_integration";
  }
  const enabled = getEnabledPaymentProviders();
  const configured = enabled.filter((id) => isProviderConfigured(id));
  if (configured.length === 0) return "configured_partial";
  if (configured.length < enabled.length) return "configured_partial";
  return "active";
}

export function isProviderConfigured(provider: PaymentProviderId): boolean {
  switch (provider) {
    case "uzum":
      return isUzumConfigured();
    case "payme":
      return isPaymeConfigured();
    case "click":
      return isClickConfigured();
    default:
      return false;
  }
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

export function getPaymeConfig() {
  return {
    merchantId: process.env.PAYME_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYME_MERCHANT_KEY ?? "",
    /** Basic Auth login Payme's servers send — "Paycom" per their infra naming (checkout.paycom.uz), not "Payme". Override via env if the cabinet ever shows something else. */
    merchantLogin: process.env.PAYME_MERCHANT_LOGIN ?? "Paycom",
    testMode: process.env.PAYME_TEST_MODE !== "false",
    checkoutBaseUrl:
      process.env.PAYME_CHECKOUT_BASE_URL ??
      (process.env.PAYME_TEST_MODE === "false"
        ? "https://checkout.paycom.uz"
        : "https://checkout.test.paycom.uz"),
  };
}

export function getClickConfig() {
  return {
    merchantId: process.env.CLICK_MERCHANT_ID ?? "",
    serviceId: process.env.CLICK_SERVICE_ID ?? "",
    secretKey: process.env.CLICK_SECRET_KEY ?? "",
    merchantUserId: process.env.CLICK_MERCHANT_USER_ID ?? "",
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

export function isPaymeConfigured(): boolean {
  const c = getPaymeConfig();
  return !!(c.merchantId && c.merchantKey);
}

export function isClickConfigured(): boolean {
  const c = getClickConfig();
  return !!(c.merchantId && c.serviceId && c.secretKey);
}

export function getUsdUzsRate(): number {
  const n = Number(process.env.USD_UZS_RATE ?? "12800");
  return Number.isFinite(n) && n > 0 ? n : 12800;
}

export function getUzumWebhookSecret(): string {
  return process.env.UZUM_WEBHOOK_SECRET ?? process.env.PAYMENT_WEBHOOK_SECRET ?? "";
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
