import {
  checkoutSessionSchema,
  parseApiResponse,
  paymentConfigSchema,
  paymentIntentSchema,
  paymentReturnSchema,
  planUsageSchema,
  plansResponseSchema,
} from "@fundingpro/api-types";
import { apiFetch, genericRecordSchema, parseResponse } from "./core";

export const paymentsApi = {
  async plans() {
    const res = await apiFetch("/plans");
    const json: unknown = await res.json();
    return parseApiResponse(json, plansResponseSchema);
  },

  async currentSubscription() {
    return parseResponse(await apiFetch("/subscriptions/current"), genericRecordSchema);
  },

  async planUsage() {
    return parseResponse(await apiFetch("/plan-usage"), planUsageSchema);
  },

  async paymentStatus() {
    return parseResponse(await apiFetch("/payments/status"), paymentConfigSchema);
  },

  async createPaymentIntent(
    planId: string,
    acceptedPaymentTerms: boolean,
    provider: "uzum" | "payme" | "click" = "uzum"
  ) {
    return parseResponse(
      await apiFetch("/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          planId,
          acceptedPaymentTerms,
          provider,
          platform: "mobile",
        }),
      }),
      paymentIntentSchema
    );
  },

  async startCheckout(paymentId: string, provider?: "uzum" | "payme" | "click") {
    return parseResponse(
      await apiFetch("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ paymentId, platform: "mobile", provider }),
      }),
      checkoutSessionSchema
    );
  },

  async pollPaymentReturn(paymentId: string) {
    return parseResponse(
      await apiFetch(`/payments/checkout/return?paymentId=${encodeURIComponent(paymentId)}`),
      paymentReturnSchema
    );
  },

  async subscriptionRequest(planId: string, planName: string) {
    return parseResponse(
      await apiFetch("/subscription-requests", {
        method: "POST",
        body: JSON.stringify({ planId, planName }),
      }),
      genericRecordSchema
    );
  },
};
