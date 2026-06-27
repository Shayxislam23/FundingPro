import { verifyPaymentWebhook } from "@/lib/api";
import {
  getPaymentIntegrationStatus,
  getPaymentProvider,
  isPaymentsEnabled,
  isPaymeConfigured,
  isClickConfigured,
  isUzumConfigured,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "./config";
import {
  createIntent as registryCreateIntent,
  getDefaultProvider,
  getLegacyUzumFlags,
  getProviderStatus,
  parsePaymentProviderId,
  startCheckout as registryStartCheckout,
} from "./providers/registry";
import { registerUzumCheckout, syncUzumCheckoutStatus } from "./providers/uzum/checkout";
import type {
  CheckoutSessionResult,
  PaymentIntentResult,
  PaymentProviderId,
  PaymentRequestResult,
  PublicPaymentConfig,
} from "./types";

export {
  isPaymentsEnabled,
  getPaymentIntegrationStatus,
  getPaymentProvider,
  getEnabledPaymentProviders,
  isUzumConfigured,
  isUzumMerchantConfigured,
  isUzumCheckoutConfigured,
  isPaymeConfigured,
  isClickConfigured,
  isProviderConfigured,
} from "./config";

export {
  createIntent,
  getProviderStatus,
  parsePaymentProviderId,
  parsePaymentProviderId as parsePaymentProvider,
  assertProviderEnabled,
  getDefaultProvider,
} from "./providers/registry";

export function createPaymentRequest(_params: {
  userId: string;
  amountUsd: number;
  serviceType: string;
  idempotencyKey: string;
}): PaymentRequestResult {
  if (!isPaymentsEnabled()) {
    return {
      status: "pending_integration",
      message:
        "Payment integration is not enabled yet. The user can submit a subscription request.",
    };
  }
  return {
    status: "ready",
    message: "Online payment is available via Uzum Bank, Payme, or Click.",
  };
}

export function handlePaymentWebhook(): PaymentRequestResult {
  return {
    status: isPaymentsEnabled() ? "ready" : "pending_integration",
    message: isPaymentsEnabled()
      ? "Use /api/v1/payments/{uzum,payme,click} merchant endpoints."
      : "Payment webhook handler is not enabled yet.",
  };
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  return verifyPaymentWebhook(payload, signature, secret);
}

export async function createSubscriptionPaymentIntent(input: {
  planId: string;
  accessToken: string;
  provider?: PaymentProviderId;
  returnUrl?: string;
}): Promise<PaymentIntentResult> {
  if (!isPaymentsEnabled()) {
    throw new Error("Payments are not enabled");
  }

  const provider = input.provider ?? getDefaultProvider();
  return registryCreateIntent(provider, {
    planId: input.planId,
    accessToken: input.accessToken,
    returnUrl: input.returnUrl,
  });
}

export async function startCheckoutSession(
  paymentId: string,
  accessToken: string,
  options?: { returnUrl?: string; platform?: string; provider?: PaymentProviderId }
): Promise<CheckoutSessionResult> {
  if (!isPaymentsEnabled()) {
    throw new Error("Payments are not enabled");
  }

  let provider = options?.provider;
  if (!provider) {
    const payment = await import("@/lib/db/payments").then((m) =>
      m.getPaymentById(paymentId, accessToken)
    );
    provider = parsePaymentProviderId(payment?.provider) ?? getDefaultProvider();
  }

  return registryStartCheckout(provider, paymentId, accessToken, {
    returnUrl: options?.returnUrl,
  });
}

export function getPublicPaymentConfig(): PublicPaymentConfig {
  const providers = getProviderStatus();
  const legacy = getLegacyUzumFlags();
  const anyConfigured = providers.some((p) => p.enabled && p.configured);

  return {
    paymentsEnabled: isPaymentsEnabled(),
    integrationStatus: getPaymentIntegrationStatus(),
    provider: getDefaultProvider(),
    providers,
    merchantConfigured: legacy.merchantConfigured,
    checkoutConfigured: legacy.checkoutConfigured,
    message: isPaymentsEnabled()
      ? anyConfigured
        ? "Оплата подписки через Uzum Bank, Payme или Click."
        : "Платёжные провайдеры включены, но credentials не настроены."
      : "Онлайн-оплата временно недоступна. Вы можете отправить запрос на подключение тарифа.",
  };
}

// Backward-compatible re-exports for Uzum checkout
export { registerUzumCheckout, syncUzumCheckoutStatus };
