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

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
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
const PUBLIC_PAYMENTS_STATUS_MAX = Number(process.env.PAYMENTS_STATUS_RATE_LIMIT_MAX ?? 60);
const WEBHOOK_MAX_REQUESTS = Number(process.env.WEBHOOK_RATE_LIMIT_MAX ?? 30);

/** Edge/middleware rate limit for selected /api/v1/* routes (IP-based, Convex-backed). */
export async function applyApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
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
