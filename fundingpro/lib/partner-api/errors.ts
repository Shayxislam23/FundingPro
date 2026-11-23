import { NextResponse } from "next/server";
import type { PartnerErrorCode } from "../../convex/lib/partnerApi";

export const PARTNER_ERROR_STATUS: Record<PartnerErrorCode, number> = {
  INVALID_API_KEY: 401,
  EXPIRED_API_KEY: 401,
  PARTNER_SUSPENDED: 403,
  FORBIDDEN_ORIGIN: 403,
  RATE_LIMIT_EXCEEDED: 429,
  INVALID_REQUEST: 400,
  CONSENT_REQUIRED: 422,
  GRANT_NOT_FOUND: 404,
  DUPLICATE_LEAD: 409,
  IDEMPOTENCY_CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class PartnerApiError extends Error {
  constructor(
    public readonly code: PartnerErrorCode,
    message: string,
    public readonly status: number = PARTNER_ERROR_STATUS[code],
    public readonly headers: Record<string, string> = {}
  ) {
    super(message);
    this.name = "PartnerApiError";
  }
}

/** Robust across module instances (bundler chunks / test loaders). */
export function isPartnerApiError(err: unknown): err is PartnerApiError {
  return (
    err instanceof PartnerApiError ||
    (typeof err === "object" &&
      err !== null &&
      (err as { name?: unknown }).name === "PartnerApiError" &&
      typeof (err as { code?: unknown }).code === "string" &&
      typeof (err as { status?: unknown }).status === "number")
  );
}

export function partnerErrorResponse(
  code: PartnerErrorCode,
  message: string,
  requestId: string,
  status: number = PARTNER_ERROR_STATUS[code],
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { error: { code, message, request_id: requestId } },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
}
