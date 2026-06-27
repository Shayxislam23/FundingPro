import { NextRequest, NextResponse } from "next/server";
import { apiError } from "./api-envelope";
import {
  AUTH_MAX_REQUESTS,
  MAX_REQUESTS,
  WINDOW_MS,
  checkAiIpRateLimitAsync,
  checkAuthRateLimitAsync,
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

/** Edge/middleware rate limit for /api/v1/ai/* and /api/v1/auth/* (IP-based, in-memory). */
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

  return null;
}

export function getApiRateLimitWindowMs(): number {
  return WINDOW_MS;
}
