import crypto from "crypto";

export function hashPartnerToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPartnerSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** One-time launch code placed in WebView URL (short TTL). */
export function createPartnerLaunchCode(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Canonical string for partner HMAC: `${timestamp}.${nonce}.${rawBody}`
 * `timestamp` must be the exact `X-Partner-Timestamp` header value (prefer unix seconds).
 * Freshness may accept ms, but the signed string is never rewritten.
 */
export function partnerSignedPayload(
  timestampHeader: string,
  nonce: string,
  rawBody: string
): string {
  return `${timestampHeader}.${nonce}.${rawBody}`;
}

export function verifyPartnerWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature.trim().toLowerCase());
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** SSO / auth-init secret only — never falls back to webhook secret. */
export function partnerAuthSecretForChannel(channelSlug: string): string | null {
  if (channelSlug === "zoomrad") {
    return process.env.ZOOMRAD_AUTH_SECRET?.trim() || null;
  }
  const envKey = `${channelSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_AUTH_SECRET`;
  return process.env[envKey]?.trim() || null;
}

/** Payment webhook secret only — never falls back to auth secret. */
export function partnerWebhookSecretForChannel(channelSlug: string): string | null {
  if (channelSlug === "zoomrad") {
    return process.env.ZOOMRAD_WEBHOOK_SECRET?.trim() || null;
  }
  const envKey = `${channelSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_WEBHOOK_SECRET`;
  return process.env[envKey]?.trim() || null;
}

/** Unsigned partner requests: never in production. */
export function partnerUnsignedAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.PARTNER_AUTH_ALLOW_UNSIGNED === "true";
}

const DEFAULT_SKEW_SEC = 300;

export function parsePartnerTimestamp(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  // Accept seconds or milliseconds
  const sec = n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
  return sec > 0 ? sec : null;
}

export function isPartnerTimestampFresh(
  timestampSec: number,
  nowSec = Math.floor(Date.now() / 1000),
  skewSec = DEFAULT_SKEW_SEC
): boolean {
  return Math.abs(nowSec - timestampSec) <= skewSec;
}
