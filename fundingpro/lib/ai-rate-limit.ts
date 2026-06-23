import { withDatabase } from "@/lib/db/runtime";

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

async function checkDatabaseRateLimit(key: string): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);

  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         VALUES ($1, 1, $2::timestamptz)
         ON CONFLICT (bucket_key) DO UPDATE SET
           count = CASE
             WHEN rate_limit_buckets.reset_at <= now() THEN 1
             ELSE rate_limit_buckets.count + 1
           END,
           reset_at = CASE
             WHEN rate_limit_buckets.reset_at <= now() THEN $2::timestamptz
             ELSE rate_limit_buckets.reset_at
           END,
           updated_at = now()
         RETURNING count, reset_at`,
        [key, resetAt.toISOString()]
      );
      const row = result.rows[0];
      return Number(row?.count ?? 0) <= MAX_REQUESTS;
    },
    async (supabase) => {
      const { data: existing } = await supabase
        .from("rate_limit_buckets")
        .select("count, reset_at")
        .eq("bucket_key", key)
        .maybeSingle();

      if (!existing || new Date(existing.reset_at) <= now) {
        const { data: upserted, error } = await supabase
          .from("rate_limit_buckets")
          .upsert(
            { bucket_key: key, count: 1, reset_at: resetAt.toISOString(), updated_at: now.toISOString() },
            { onConflict: "bucket_key" }
          )
          .select("count")
          .single();
        if (error) return checkMemoryRateLimit(key);
        return (upserted?.count ?? 1) <= MAX_REQUESTS;
      }

      const nextCount = existing.count + 1;
      if (nextCount > MAX_REQUESTS) return false;

      await supabase
        .from("rate_limit_buckets")
        .update({ count: nextCount, updated_at: now.toISOString() })
        .eq("bucket_key", key);

      return true;
    }
  );
}

export function checkAiRateLimit(userId: string): boolean {
  const key = `ai:${userId}`;
  return checkMemoryRateLimit(key);
}

export async function checkAiRateLimitAsync(userId: string): Promise<boolean> {
  const key = `ai:${userId}`;
  try {
    return await checkDatabaseRateLimit(key);
  } catch {
    return checkMemoryRateLimit(key);
  }
}

export async function checkRateLimitAsync(bucketKey: string): Promise<boolean> {
  try {
    return await checkDatabaseRateLimit(bucketKey);
  } catch {
    return checkMemoryRateLimit(bucketKey);
  }
}
