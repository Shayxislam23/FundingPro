export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/payments/webhook
 * Deprecated — use /api/v1/payments/uzum/* for Uzum Merchant API.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "This endpoint is deprecated. Use Uzum payment webhooks instead.",
      redirect: "/api/v1/payments/uzum/check",
    },
    { status: 410 }
  );
}
