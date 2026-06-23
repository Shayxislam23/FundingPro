import type { Pool } from "pg";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type DbMode = "local" | "supabase";

export function getDbMode(): DbMode {
  return isLocalDatabaseEnabled() ? "local" : "supabase";
}

export { isLocalDatabaseEnabled, getPgPool, createSupabaseAdmin };

/**
 * Single entry point for database access — avoids duplicating local vs Supabase branching.
 */
export async function withDatabase<T>(
  pgFn: (pool: Pool) => Promise<T>,
  supabaseFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  if (isLocalDatabaseEnabled()) {
    return pgFn(getPgPool());
  }
  return supabaseFn(createSupabaseAdmin());
}
