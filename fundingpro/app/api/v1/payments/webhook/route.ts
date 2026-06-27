export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withPaymentWebhook } from "@/lib/api-route";

/**
 * POST /api/v1/payments/webhook
 * Deprecated — use /api/v1/payments/uzum/* for Uzum Merchant API.
 */
export const POST = withPaymentWebhook(async () => {
  return NextResponse.json(
    {
      success: false,
      error: "This endpoint is deprecated. Use Uzum payment webhooks instead.",
      redirect: "/api/v1/payments/uzum/check",
    },
    { status: 410 }
  );
});
