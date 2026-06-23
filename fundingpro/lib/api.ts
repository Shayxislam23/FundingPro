import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: { message, code: code ?? "ERROR" } }, { status });
}

export function getRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

/** Verify payment webhook HMAC-SHA256 signature (fail-closed). */
export function verifyPaymentWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
