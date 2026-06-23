export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handlePaymentWebhook } from "@/lib/payments";

/**
 * POST /api/v1/payments/webhook
 * Legacy endpoint — use /api/v1/payments/uzum/* for Uzum Merchant API.
 */
export async function POST(_req: NextRequest) {
  const result = handlePaymentWebhook();
  return apiSuccess({
    ...result,
    webhookReceived: true,
    redirect: "/api/v1/payments/uzum/check",
  });
}
