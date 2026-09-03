export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withPaymentWebhook } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import {
  handleZoomradPaymentWebhook,
  verifyZoomradWebhook,
} from "@/lib/partners/service";
import { normalizePartnerSlug } from "@/lib/partners/channels";

export const POST = withPaymentWebhook(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-zoomrad-signature");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400, "INVALID_JSON");
  }

  const channel = normalizePartnerSlug(typeof body.channel === "string" ? body.channel : "zoomrad");
  if (!verifyZoomradWebhook(rawBody, signature)) {
    return apiError("Invalid webhook signature", 401, "WEBHOOK_AUTH_FAILED");
  }

  const paymentId = String(body.paymentId ?? "").trim();
  const externalTransactionId = String(body.externalTransactionId ?? "").trim();
  const idempotencyKey = String(body.idempotencyKey ?? "").trim();
  const statusRaw = String(body.status ?? "").trim().toLowerCase();
  const amountTiyin = Number(body.amountTiyin);

  if (!paymentId || !externalTransactionId || !idempotencyKey || !Number.isFinite(amountTiyin)) {
    return apiError("Missing webhook fields", 400, "MISSING_FIELDS");
  }

  const status =
    statusRaw === "success" || statusRaw === "failed" || statusRaw === "pending"
      ? statusRaw
      : null;
  if (!status) {
    return apiError("Invalid payment status", 400, "INVALID_STATUS");
  }

  try {
    const result = await handleZoomradPaymentWebhook({
      channel,
      paymentId,
      externalTransactionId,
      status,
      amountTiyin: Math.round(amountTiyin),
      idempotencyKey,
    });

    if (
      result.status === "AMOUNT_MISMATCH" ||
      result.status === "CHANNEL_MISMATCH" ||
      result.status === "PROVIDER_MISMATCH"
    ) {
      return apiError(`Webhook rejected: ${result.status}`, 409, result.status);
    }
    if (result.status === "NOT_FOUND") {
      return apiError("Payment not found", 404, "NOT_FOUND");
    }

    await writeAuditLog({
      userId: "system",
      action: "zoomrad_payment_webhook",
      entityType: "payment",
      entityId: paymentId,
      metadata: {
        channel,
        status: result.status,
        duplicate: result.duplicate,
        externalTransactionId,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("POST /zoomrad/payments/webhook error:", err);
    return apiError(err instanceof Error ? err.message : "Internal error", 500, "INTERNAL_ERROR");
  }
});
