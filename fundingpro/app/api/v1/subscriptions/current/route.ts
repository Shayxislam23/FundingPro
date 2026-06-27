export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getUserSubscription } from "@/lib/db/users";
import {
  getPaymentIntegrationStatus,
  getPublicPaymentConfig,
  isPaymentIntegrationPending,
} from "@/lib/payments";

export const GET = withActiveUser(async (_req, authUser) => {
  const subscription = await getUserSubscription(authUser.userId);
  const paymentConfig = getPublicPaymentConfig();
  const paymentPendingIntegration = await isPaymentIntegrationPending();

  return apiSuccess({
    subscription,
    plan: subscription?.plan ?? null,
    status: subscription ? "active" : "none",
    paymentPendingIntegration,
    payment: {
      integrationStatus: getPaymentIntegrationStatus(),
      paymentsEnabled: paymentConfig.paymentsEnabled,
      provider: paymentConfig.provider,
      merchantConfigured: paymentConfig.merchantConfigured,
      checkoutConfigured: paymentConfig.checkoutConfigured,
      message: paymentConfig.message,
    },
  });
});
