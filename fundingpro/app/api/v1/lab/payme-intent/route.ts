export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { createLabPaymePayment } from "@/lib/db/lab";
import {
  getEnabledPaymentProviders,
  isPaymeConfigured,
  isPaymentsEnabled,
} from "@/lib/payments";
import { buildPaymeCheckoutUrl } from "@/lib/payments/providers/payme/checkout";

export const POST = withActiveUser(async (_req, authUser) => {
  if (!isPaymentsEnabled() || !getEnabledPaymentProviders().includes("payme")) {
    return apiError("Payme payments are not enabled", 503, "PAYME_DISABLED");
  }
  if (!isPaymeConfigured()) {
    return apiError("Payme merchant is not configured", 503, "PAYME_NOT_CONFIGURED");
  }

  const payment = await createLabPaymePayment(authUser.accessToken);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const returnUrl = `${appUrl}/dashboard/lab/checkout?paymentId=${payment.paymentId}`;
  const redirectUrl = buildPaymeCheckoutUrl(payment.paymentId, payment.amountTiyin, returnUrl);

  if (!redirectUrl) {
    return apiError("Payme checkout URL could not be created", 500, "PAYME_CHECKOUT_FAILED");
  }

  return apiSuccess({ ...payment, redirectUrl }, 201);
});
