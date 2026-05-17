import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// POST /api/v1/zoomrad/payments/create
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { planId, serviceType, idempotencyKey } = body;

    if (!planId || !serviceType || !idempotencyKey) {
      return apiError("planId, serviceType, idempotencyKey required", 400, "MISSING_FIELDS");
    }

    // TODO: validate planId exists
    // TODO: check idempotencyKey not already used
    // TODO: create Payment record with status=PENDING
    // TODO: call ZOOMRAD payment initiation API
    // TODO: write audit log: action="payment_create"

    return apiSuccess({
      paymentId: "TODO_PAYMENT_ID",
      zoomradPaymentUrl: "TODO_ZOOMRAD_PAYMENT_URL",
      // SECURITY: activation happens only via webhook, not here
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
