import { NextRequest, NextResponse } from "next/server";
import { apiError } from "./api-envelope";
import {
  AUTH_MAX_REQUESTS,
  MAX_REQUESTS,
  WINDOW_MS,
  checkAiIpRateLimitAsync,
  checkAuthRateLimitAsync,
  checkRateLimitAsync,
  getRateLimitSnapshotAsync,
} from "./ai-rate-limit";

// Loose but bounded IPv4/IPv6 shape check — not full RFC validation. The
// goal is defense in depth: reject obviously-forged or malformed header
// values (arbitrary strings, oversized payloads) before they become a
// rate-limit bucket key, rather than assuming the deployment platform's
// edge always sanitizes this header for us.
const IP_SHAPE = /^[0-9a-fA-F:.]{2,45}$/;

function sanitizeIp(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return IP_SHAPE.test(trimmed) ? trimmed : null;
}

/**
 * On Vercel, `x-forwarded-for` is set by the edge network to reflect the
 * real connecting client and is not attacker-controllable end to end.
 * Off Vercel (self-hosted, behind a different proxy) that guarantee does
 * not automatically hold — this function only adds shape validation, it
 * does not itself establish a trusted-proxy chain.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0] ?? "";
    const sanitized = sanitizeIp(first);
    if (sanitized) return sanitized;
  }
  return sanitizeIp(req.headers.get("x-real-ip")) ?? "unknown";
}

function rateLimitHeaders(key: string, maxRequests: number): Promise<Record<string, string>> {
  return getRateLimitSnapshotAsync(key, maxRequests).then((snapshot) => {
    const retryAfterSec = Math.max(1, Math.ceil((snapshot.resetAt - Date.now()) / 1000));
    return {
      "X-RateLimit-Limit": String(snapshot.limit),
      "X-RateLimit-Remaining": String(snapshot.remaining),
      "X-RateLimit-Reset": String(Math.ceil(snapshot.resetAt / 1000)),
      "Retry-After": String(retryAfterSec),
    };
  });
}

function withRateLimitHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
}

const LEAD_MAGNET_MAX_REQUESTS = Number(process.env.LEAD_MAGNET_RATE_LIMIT_MAX ?? 10);
const LAB_MAX_REQUESTS = Number(process.env.LAB_RATE_LIMIT_MAX ?? 120);
const PUBLIC_PAYMENTS_STATUS_MAX = Number(process.env.PAYMENTS_STATUS_RATE_LIMIT_MAX ?? 60);
const WEBHOOK_MAX_REQUESTS = Number(process.env.WEBHOOK_RATE_LIMIT_MAX ?? 30);

/** Edge/middleware rate limit for selected /api/v1/* routes (IP-based, Convex-backed). */
export async function applyApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
  try {
    return await applyApiRateLimitInner(req);
  } catch (err) {
    // Fail open: a rate-limiter backend outage must not take down the API
    // (these paths include payment provider webhooks).
    console.error("applyApiRateLimit degraded (fail-open):", err);
    return null;
  }
}

async function applyApiRateLimitInner(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  if (pathname.startsWith("/api/v1/auth/")) {
    const bucketKey = `auth:${ip}`;
    const allowed = await checkAuthRateLimitAsync(ip);
    const headers = await rateLimitHeaders(bucketKey, AUTH_MAX_REQUESTS);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  if (pathname.startsWith("/api/v1/ai/")) {
    const bucketKey = `ai-ip:${ip}`;
    const allowed = await checkAiIpRateLimitAsync(ip);
    const headers = await rateLimitHeaders(bucketKey, MAX_REQUESTS);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  if (pathname === "/api/v1/lead-magnet") {
    const bucketKey = `lead-magnet:${ip}`;
    const allowed = await checkRateLimitAsync(bucketKey, LEAD_MAGNET_MAX_REQUESTS);
    const headers = await rateLimitHeaders(bucketKey, LEAD_MAGNET_MAX_REQUESTS);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  if (
    pathname.startsWith("/api/v1/lab/") ||
    pathname === "/api/v1/onboarding/lab-profile" ||
    pathname === "/api/v1/onboarding/tasks"
  ) {
    const bucketKey = `lab:${ip}`;
    const allowed = await checkRateLimitAsync(bucketKey, LAB_MAX_REQUESTS);
    const headers = await rateLimitHeaders(bucketKey, LAB_MAX_REQUESTS);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  if (pathname === "/api/v1/payments/status") {
    const bucketKey = `payments-status:${ip}`;
    const allowed = await checkRateLimitAsync(bucketKey, PUBLIC_PAYMENTS_STATUS_MAX);
    const headers = await rateLimitHeaders(bucketKey, PUBLIC_PAYMENTS_STATUS_MAX);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  if (pathname === "/api/v1/payments/webhook") {
    const bucketKey = `payments-webhook:${ip}`;
    const allowed = await checkRateLimitAsync(bucketKey, WEBHOOK_MAX_REQUESTS);
    const headers = await rateLimitHeaders(bucketKey, WEBHOOK_MAX_REQUESTS);
    if (!allowed) {
      return withRateLimitHeaders(
        apiError("Too many requests. Try again later.", 429, "RATE_LIMITED"),
        headers
      );
    }
    return null;
  }

  return null;
}

export function getApiRateLimitWindowMs(): number {
  return WINDOW_MS;
}
