import type { Pool } from "pg";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type DbMode = "local" | "supabase";

export function getDbMode(): DbMode {
  return isLocalDatabaseEnabled() ? "local" : "supabase";
}

export { isLocalDatabaseEnabled, getPgPool, createSupabaseAdmin };

/**
 * Supabase client scoped to the authenticated user — respects RLS policies.
 */
export function createUserSupabase(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

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

/**
 * User-owned data: local PG, Supabase with user JWT (RLS), or admin fallback when no token.
 */
export async function withUserOrAdminDatabase<T>(
  accessToken: string | null | undefined,
  pgFn: (pool: Pool) => Promise<T>,
  supabaseFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  if (isLocalDatabaseEnabled()) {
    return pgFn(getPgPool());
  }
  const client = accessToken
    ? createUserSupabase(accessToken)
    : createSupabaseAdmin();
  return supabaseFn(client);
}
