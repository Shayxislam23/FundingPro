import { internal } from "../convex/_generated/api";
import { convexInternalMutation, convexInternalQuery } from "./convex-server";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30);
const AUTH_MAX_REQUESTS = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20);

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export { WINDOW_MS, MAX_REQUESTS, AUTH_MAX_REQUESTS };

type RateLimitSnapshot = {
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitCheckResult = RateLimitSnapshot & {
  allowed: boolean;
  count: number;
};

function shouldUseMemoryFallback(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.CONVEX_DEPLOY_KEY;
}

function checkMemoryRateLimit(key: string, maxRequests = MAX_REQUESTS): boolean {
  const now = Date.now();
  const entry = memoryBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  return true;
}

function getMemoryRateLimitSnapshot(key: string, maxRequests: number): RateLimitSnapshot {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    return { limit: maxRequests, remaining: maxRequests - 1, resetAt: now + WINDOW_MS };
  }
  return {
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

async function checkConvexRateLimit(
  key: string,
  maxRequests: number
): Promise<RateLimitCheckResult | null> {
  if (shouldUseMemoryFallback()) return null;

  try {
    return await convexInternalMutation(internal.rateLimits.checkRateLimit, {
      key,
      maxRequests,
      windowMs: WINDOW_MS,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Convex rate limit unavailable, using memory fallback:", error);
      return null;
    }
    throw error;
  }
}

async function getConvexRateLimitSnapshot(
  key: string,
  maxRequests: number
): Promise<RateLimitSnapshot | null> {
  if (shouldUseMemoryFallback()) return null;

  try {
    return await convexInternalQuery(internal.rateLimits.getRateLimitSnapshot, {
      key,
      maxRequests,
      windowMs: WINDOW_MS,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Convex rate limit snapshot unavailable, using memory fallback:", error);
      return null;
    }
    throw error;
  }
}

async function enforceRateLimit(key: string, maxRequests: number): Promise<boolean> {
  const convexResult = await checkConvexRateLimit(key, maxRequests);
  if (convexResult) return convexResult.allowed;
  if (shouldUseMemoryFallback()) {
    return checkMemoryRateLimit(key, maxRequests);
  }
  console.error("Rate limit backend unavailable; denying request", { key });
  return false;
}

export function getRateLimitSnapshot(key: string, maxRequests: number): RateLimitSnapshot {
  return getMemoryRateLimitSnapshot(key, maxRequests);
}

export async function getRateLimitSnapshotAsync(
  key: string,
  maxRequests: number
): Promise<RateLimitSnapshot> {
  const convexSnapshot = await getConvexRateLimitSnapshot(key, maxRequests);
  if (convexSnapshot) return convexSnapshot;
  if (shouldUseMemoryFallback()) {
    return getMemoryRateLimitSnapshot(key, maxRequests);
  }
  const now = Date.now();
  return { limit: maxRequests, remaining: 0, resetAt: now + WINDOW_MS };
}

export function checkAiRateLimit(userId: string): boolean {
  return checkMemoryRateLimit(`ai:${userId}`);
}

export async function checkAiRateLimitAsync(userId: string): Promise<boolean> {
  return enforceRateLimit(`ai:${userId}`, MAX_REQUESTS);
}

export async function checkAuthRateLimitAsync(clientKey: string): Promise<boolean> {
  return enforceRateLimit(`auth:${clientKey}`, AUTH_MAX_REQUESTS);
}

export async function checkAiIpRateLimitAsync(clientKey: string): Promise<boolean> {
  return enforceRateLimit(`ai-ip:${clientKey}`, MAX_REQUESTS);
}

export async function checkRateLimitAsync(
  bucketKey: string,
  maxRequests = MAX_REQUESTS
): Promise<boolean> {
  return enforceRateLimit(bucketKey, maxRequests);
}
