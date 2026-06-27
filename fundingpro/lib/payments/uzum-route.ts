import { NextRequest, NextResponse } from "next/server";
import { UzumAuthError, validateUzumBasicAuth } from "@/lib/payments/uzum-auth";
import {
  getUzumMerchantConfig,
  getUzumWebhookSecret,
  isPaymentsEnabled,
} from "@/lib/payments/config";
import { verifyWebhookSignature } from "@/lib/payments/service";

type Handler<T> = (body: T) => Promise<Record<string, unknown>>;

function readWebhookSignature(req: NextRequest): string {
  return (
    req.headers.get("x-uzum-signature") ??
    req.headers.get("x-webhook-signature") ??
    req.headers.get("x-signature") ??
    ""
  ).trim();
}

export async function withUzumMerchant<T extends Record<string, unknown>>(
  req: NextRequest,
  handler: Handler<T>
): Promise<NextResponse> {
  try {
    validateUzumBasicAuth(req.headers.get("authorization"));
    const rawBody = await req.text();
    const webhookSecret = getUzumWebhookSecret();
    if (isPaymentsEnabled() && !webhookSecret) {
      const { serviceId } = getUzumMerchantConfig();
      return NextResponse.json(
        {
          serviceId,
          timestamp: String(Date.now()),
          status: "FAILED",
          errorCode: "WebhookSecretMissing",
        },
        { status: 503 }
      );
    }
    if (webhookSecret) {
      const signature = readWebhookSignature(req);
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        const { serviceId } = getUzumMerchantConfig();
        return NextResponse.json(
          {
            serviceId,
            timestamp: String(Date.now()),
            status: "FAILED",
            errorCode: "InvalidSignature",
          },
          { status: 401 }
        );
      }
    }

    let body: T;
    try {
      body = JSON.parse(rawBody) as T;
    } catch {
      const { serviceId } = getUzumMerchantConfig();
      return NextResponse.json(
        {
          serviceId,
          timestamp: String(Date.now()),
          status: "FAILED",
          errorCode: "InvalidPayload",
        },
        { status: 400 }
      );
    }

    const result = await handler(body);
    const status = result.status === "FAILED" ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (e) {
    const { serviceId } = getUzumMerchantConfig();
    if (e instanceof UzumAuthError) {
      return NextResponse.json(
        {
          serviceId,
          timestamp: String(Date.now()),
          status: "FAILED",
          errorCode: e.errorCode,
        },
        { status: 401 }
      );
    }
    console.error("Uzum merchant handler error:", e);
    return NextResponse.json(
      {
        serviceId,
        timestamp: String(Date.now()),
        status: "FAILED",
        errorCode: "InternalError",
      },
      { status: 500 }
    );
  }
}
