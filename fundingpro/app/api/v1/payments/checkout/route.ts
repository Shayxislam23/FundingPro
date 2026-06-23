export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getPaymentById } from "@/lib/db/payments";
import { isPaymentsEnabled, startCheckoutSession } from "@/lib/payments";

export const POST = withActiveUser(async (req, authUser) => {
  if (!isPaymentsEnabled()) {
    return apiError("Payments are not enabled", 503, "PAYMENTS_DISABLED");
  }

  try {
    const body = await req.json();
    const paymentId = String(body.paymentId ?? "").trim();
    if (!paymentId) return apiError("paymentId required", 400, "MISSING_FIELDS");

    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== authUser.userId) {
      return apiError("Payment not found", 404, "NOT_FOUND");
    }

    const session = await startCheckoutSession(paymentId);
    return apiSuccess(session);
  } catch (err) {
    console.error("POST /payments/checkout error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
