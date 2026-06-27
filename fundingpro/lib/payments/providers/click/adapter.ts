import { createPaymentIntent, getPlanPricing } from "@/lib/db/payments";
import { usdToTiyin, usdToUzs } from "../../pricing";
import type { PaymentIntentResult } from "../../types";
import { buildClickPayUrl } from "./shop";

export async function createClickIntent(input: {
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
      provider: "click",
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
    provider: "click",
    uzumAppUrl: null,
    paymeCheckoutUrl: null,
    clickPayUrl: buildClickPayUrl(paymentId, amountTiyin),
  };
}
