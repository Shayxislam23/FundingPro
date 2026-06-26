import { api, convexMutation, convexPublicQuery, convexQuery } from "@/lib/convex-server";

export async function createSubscriptionRequest(
  input: {
    planId: string;
    planName: string;
    amountUsd: number;
    amountUzs: number;
    amountTiyin: number;
  },
  accessToken: string
) {
  return convexMutation(api.subscriptionRequests.create, input, accessToken);
}

export async function getPlanPriceUsd(planId: string) {
  return convexPublicQuery(api.plans.getPriceUsd, { planId });
}

export async function listPendingSubscriptionPlanIds(accessToken: string) {
  return convexQuery(api.subscriptionRequests.listPendingPlanIds, {}, accessToken);
}
