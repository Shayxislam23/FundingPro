import { createPaymentIntent, getPlanPricing } from "@/lib/db/payments";
import {
  buildUzumAppDeepLink,
  getPaymentIntegrationStatus,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "./config";
import { usdToTiyin, usdToUzs } from "./pricing";
import { registerUzumCheckout } from "./uzum-checkout";
import type { CheckoutSessionResult, PaymentIntentResult, PaymentRequestResult } from "./types";

export {
  isPaymentsEnabled,
  getPaymentIntegrationStatus,
  isUzumConfigured,
  isUzumMerchantConfigured,
  isUzumCheckoutConfigured,
} from "./config";

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
    message: "Online payment is available via Uzum Bank.",
  };
}

export function handlePaymentWebhook(): PaymentRequestResult {
  return {
    status: isPaymentsEnabled() ? "ready" : "pending_integration",
    message: isPaymentsEnabled()
      ? "Use /api/v1/payments/uzum/* merchant endpoints."
      : "Payment webhook handler is not enabled yet.",
  };
}

export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  secret: string
): boolean {
  if (!secret) return false;
  return false;
}

export async function createSubscriptionPaymentIntent(input: {
  userId: string;
  planId: string;
}): Promise<PaymentIntentResult> {
  if (!isPaymentsEnabled()) {
    throw new Error("Payments are not enabled");
  }

  const plan = await getPlanPricing(input.planId);
  if (!plan) throw new Error("Plan not found");

  const amountUzs = plan.priceUzs > 0 ? plan.priceUzs : usdToUzs(plan.priceUsd);
  const amountTiyin = usdToTiyin(plan.priceUsd);

  const { paymentId, subscriptionId } = await createPaymentIntent({
    userId: input.userId,
    planId: input.planId,
    planName: plan.nameRu,
    amountUsd: plan.priceUsd,
    amountUzs,
    amountTiyin,
  });

  return {
    paymentId,
    subscriptionId,
    planId: input.planId,
    planName: plan.nameRu,
    amountUsd: plan.priceUsd,
    amountUzs,
    amountTiyin,
    currency: "UZS",
    provider: "uzum",
    uzumAppUrl: buildUzumAppDeepLink(paymentId, amountTiyin),
  };
}

export async function startCheckoutSession(paymentId: string): Promise<CheckoutSessionResult> {
  if (!isPaymentsEnabled()) {
    throw new Error("Payments are not enabled");
  }
  return registerUzumCheckout(paymentId);
}

export function getPublicPaymentConfig() {
  return {
    paymentsEnabled: isPaymentsEnabled(),
    integrationStatus: getPaymentIntegrationStatus(),
    provider: "uzum",
    merchantConfigured: isUzumMerchantConfigured(),
    checkoutConfigured: isUzumCheckoutConfigured(),
    message: isPaymentsEnabled()
      ? "Оплата подписки через Uzum Bank (приложение или карта на сайте)."
      : "Онлайн-оплата временно недоступна. Вы можете отправить запрос на подключение тарифа.",
  };
}
