const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30);
const AUTH_MAX_REQUESTS = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20);

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export { WINDOW_MS, MAX_REQUESTS, AUTH_MAX_REQUESTS };

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

export function getRateLimitSnapshot(key: string, maxRequests: number): {
  limit: number;
  remaining: number;
  resetAt: number;
} {
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

export function checkAiRateLimit(userId: string): boolean {
  const key = `ai:${userId}`;
  return checkMemoryRateLimit(key);
}

export async function checkAiRateLimitAsync(userId: string): Promise<boolean> {
  return checkMemoryRateLimit(`ai:${userId}`);
}

export async function checkAuthRateLimitAsync(clientKey: string): Promise<boolean> {
  return checkMemoryRateLimit(`auth:${clientKey}`, AUTH_MAX_REQUESTS);
}

export async function checkAiIpRateLimitAsync(clientKey: string): Promise<boolean> {
  return checkMemoryRateLimit(`ai-ip:${clientKey}`, MAX_REQUESTS);
}

export async function checkRateLimitAsync(
  bucketKey: string,
  maxRequests = MAX_REQUESTS
): Promise<boolean> {
  return checkMemoryRateLimit(bucketKey, maxRequests);
}
