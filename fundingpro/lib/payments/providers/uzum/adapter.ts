import { createPaymentIntent, getPlanPricing } from "@/lib/db/payments";
import { buildUzumAppDeepLink } from "../../config";
import { usdToTiyin, usdToUzs } from "../../pricing";
import type { PaymentIntentResult } from "../../types";
import { registerUzumCheckout } from "./checkout";

export async function createUzumIntent(input: {
  planId: string;
  accessToken: string;
}): Promise<PaymentIntentResult> {
  const plan = await getPlanPricing(input.planId);
  if (!plan) throw new Error("Plan not found");

  const amountUzs = plan.priceUzs > 0 ? plan.priceUzs : usdToUzs(plan.priceUsd);
  const amountTiyin = usdToTiyin(plan.priceUsd);

  const { paymentId, subscriptionId } = await createPaymentIntent(
    {
      planId: input.planId,
      planName: plan.nameRu,
      amountUsd: plan.priceUsd,
      amountUzs,
      amountTiyin,
      provider: "uzum",
    },
    input.accessToken
  );

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
    paymeCheckoutUrl: null,
    clickPayUrl: null,
  };
}

export async function startUzumCheckout(
  paymentId: string,
  accessToken: string,
  options?: { returnUrl?: string }
) {
  return registerUzumCheckout(paymentId, accessToken, options);
}
