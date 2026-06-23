export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { getUserSubscription } from "@/lib/db/users";
import { getPaymentIntegrationStatus, getPublicPaymentConfig, isPaymentsEnabled } from "@/lib/payments";

// GET /api/v1/subscriptions/current
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const subscription = await getUserSubscription(authUser.userId);
  const paymentConfig = getPublicPaymentConfig();

  return apiSuccess({
    subscription,
    plan: subscription?.plan ?? null,
    status: subscription ? "active" : "none",
    paymentPendingIntegration: !isPaymentsEnabled(),
    payment: {
      integrationStatus: getPaymentIntegrationStatus(),
      paymentsEnabled: paymentConfig.paymentsEnabled,
      provider: paymentConfig.provider,
      merchantConfigured: paymentConfig.merchantConfigured,
      checkoutConfigured: paymentConfig.checkoutConfigured,
      message: paymentConfig.message,
    },
  });
}
