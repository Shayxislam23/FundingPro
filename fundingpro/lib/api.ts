import { NextRequest, NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: { message, code: code ?? "ERROR" } }, { status });
}

export function getRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

// Placeholder: verify JWT from request
export function getAuthUser(req: NextRequest): { userId: string } | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  // TODO: verify JWT token
  // For now return placeholder user
  return { userId: "placeholder-user-id" };
}

// Placeholder: verify ZOOMRAD webhook signature
export function verifyZoomradWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: implement HMAC-SHA256 signature verification
  // SECURITY: webhook activation must never rely only on frontend callback
  if (!secret) return false;
  return true; // placeholder
}
