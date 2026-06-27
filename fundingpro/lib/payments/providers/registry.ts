import type { CheckoutSessionResult, PaymentIntentResult, PaymentProviderId, ProviderStatusEntry } from "../types";
import {
  getEnabledPaymentProviders,
  isProviderConfigured,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "../config";
import { createClickIntent } from "./click/adapter";
import { createPaymeIntent } from "./payme/adapter";
import { createUzumIntent, startUzumCheckout } from "./uzum/adapter";

const PROVIDER_META: Record<
  PaymentProviderId,
  { label: string; methods: string[] }
> = {
  uzum: { label: "Uzum Bank", methods: ["app", "card"] },
  payme: { label: "Payme", methods: ["checkout"] },
  click: { label: "Click", methods: ["superapp", "checkout"] },
};

const ALL_PROVIDERS: PaymentProviderId[] = ["uzum", "payme", "click"];

export function parsePaymentProviderId(value: unknown): PaymentProviderId | null {
  if (typeof value !== "string") return null;
  const id = value.trim().toLowerCase();
  return ALL_PROVIDERS.includes(id as PaymentProviderId) ? (id as PaymentProviderId) : null;
}

export function assertProviderEnabled(provider: PaymentProviderId): void {
  if (!isPaymentsEnabled()) {
    throw new Error("Payments are not enabled");
  }
  const enabled = getEnabledPaymentProviders();
  if (!enabled.includes(provider)) {
    throw new Error(`Payment provider "${provider}" is not enabled`);
  }
  if (!isProviderConfigured(provider)) {
    throw new Error(`Payment provider "${provider}" is not configured`);
  }
}

export function getProviderStatus(): ProviderStatusEntry[] {
  const enabled = getEnabledPaymentProviders();
  return ALL_PROVIDERS.map((id) => ({
    id,
    enabled: enabled.includes(id),
    configured: isProviderConfigured(id),
    label: PROVIDER_META[id].label,
    methods: PROVIDER_META[id].methods,
  }));
}

export async function createIntent(
  provider: PaymentProviderId,
  input: { planId: string; accessToken: string; returnUrl?: string }
): Promise<PaymentIntentResult> {
  assertProviderEnabled(provider);
  switch (provider) {
    case "uzum":
      return createUzumIntent(input);
    case "payme":
      return createPaymeIntent(input);
    case "click":
      return createClickIntent(input);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

export async function startCheckout(
  provider: PaymentProviderId,
  paymentId: string,
  accessToken: string,
  options?: { returnUrl?: string }
): Promise<CheckoutSessionResult> {
  switch (provider) {
    case "uzum":
      return startUzumCheckout(paymentId, accessToken, options);
    case "payme": {
      const payment = await import("@/lib/db/payments").then((m) => m.getPaymentById(paymentId, accessToken));
      if (!payment) throw new Error("Payment not found");
      const amountTiyin =
        payment.amountTiyin > 0 ? payment.amountTiyin : Number(payment.metadata.amountTiyin ?? 0);
      const { buildPaymeCheckoutUrl } = await import("./payme/checkout");
      const redirectUrl = buildPaymeCheckoutUrl(paymentId, amountTiyin, options?.returnUrl);
      if (!redirectUrl) throw new Error("Payme checkout not configured");
      return { paymentId, redirectUrl, checkoutOrderId: paymentId };
    }
    case "click": {
      const payment = await import("@/lib/db/payments").then((m) => m.getPaymentById(paymentId, accessToken));
      if (!payment) throw new Error("Payment not found");
      const amountTiyin =
        payment.amountTiyin > 0 ? payment.amountTiyin : Number(payment.metadata.amountTiyin ?? 0);
      const { buildClickPayUrl } = await import("./click/shop");
      const redirectUrl = buildClickPayUrl(paymentId, amountTiyin);
      if (!redirectUrl) throw new Error("Click checkout not configured");
      return { paymentId, redirectUrl, checkoutOrderId: paymentId };
    }
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

export function getDefaultProvider(): PaymentProviderId {
  const enabled = getEnabledPaymentProviders().filter((id) => isProviderConfigured(id));
  return enabled[0] ?? "uzum";
}

export { isProviderConfigured };

export function getLegacyUzumFlags() {
  return {
    merchantConfigured: isUzumMerchantConfigured(),
    checkoutConfigured: isUzumCheckoutConfigured(),
  };
}
