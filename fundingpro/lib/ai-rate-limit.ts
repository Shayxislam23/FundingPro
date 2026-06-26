const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30);

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = memoryBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export function checkAiRateLimit(userId: string): boolean {
  const key = `ai:${userId}`;
  return checkMemoryRateLimit(key);
}

export async function checkAiRateLimitAsync(userId: string): Promise<boolean> {
  return checkMemoryRateLimit(`ai:${userId}`);
}

export async function checkRateLimitAsync(bucketKey: string): Promise<boolean> {
  return checkMemoryRateLimit(bucketKey);
}
