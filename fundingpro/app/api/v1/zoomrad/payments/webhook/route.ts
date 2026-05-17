import { NextRequest, NextResponse } from "next/server";
import { verifyZoomradWebhook } from "@/lib/api";

// POST /api/v1/zoomrad/payments/webhook
// SECURITY: Subscription activation relies ONLY on this signed webhook
// Never activate subscription from frontend callback alone
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-zoomrad-signature") ?? "";
    const webhookSecret = process.env.ZOOMRAD_WEBHOOK_SECRET ?? "";
    const rawBody = await req.text();

    // Verify signature first — reject unsigned webhooks
    if (!verifyZoomradWebhook(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { eventType, transactionId, idempotencyKey, metadata } = event;

    // Idempotency: check if event already processed
    // TODO: check idempotencyKey in database

    switch (eventType) {
      case "payment.success":
        // TODO: update Payment record status → SUCCESS
        // TODO: activate Subscription
        // TODO: write audit log: action="subscription_activation"
        // TODO: send notification to user
        break;
      case "payment.failed":
        // TODO: update Payment record status → FAILED
        break;
      case "payment.refunded":
        // TODO: update Payment record status → REFUNDED
        // TODO: deactivate Subscription if needed
        // TODO: write audit log: action="payment_refund"
        break;
      default:
        // Log unknown events but return 200 to prevent ZOOMRAD retries
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
