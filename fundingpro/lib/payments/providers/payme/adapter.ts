import { createPaymentIntent, getPlanPricing } from "@/lib/db/payments";
import { usdToTiyin, usdToUzs } from "../../pricing";
import type { PaymentIntentResult } from "../../types";
import { buildPaymeCheckoutUrl } from "./checkout";

export async function createPaymeIntent(input: {
  planId: string;
  accessToken: string;
  returnUrl?: string;
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
      provider: "payme",
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
    provider: "payme",
    uzumAppUrl: null,
    paymeCheckoutUrl: buildPaymeCheckoutUrl(paymentId, amountTiyin, input.returnUrl),
    clickPayUrl: null,
  };
}
