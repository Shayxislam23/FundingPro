export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getPaymentById } from "@/lib/db/payments";
import { syncUzumCheckoutStatus } from "@/lib/payments/uzum-checkout";
import { isPaymentsEnabled } from "@/lib/payments";

export const GET = withActiveUser(async (req, authUser) => {
  if (!isPaymentsEnabled()) {
    return apiError("Payments are not enabled", 503, "PAYMENTS_DISABLED");
  }

  const paymentId = req.nextUrl.searchParams.get("paymentId")?.trim();
  if (!paymentId) return apiError("paymentId required", 400, "MISSING_FIELDS");

  try {
    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== authUser.userId) {
      return apiError("Payment not found", 404, "NOT_FOUND");
    }

    const result = await syncUzumCheckoutStatus(paymentId);
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /payments/checkout/return error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
