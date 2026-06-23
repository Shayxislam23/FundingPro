import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client that reads cookies (for RSC / Server Actions).
 * Uses anon key — respects Row Level Security.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch { /* Server Component — ignore */ }
      },
    },
  });
}

/**
 * Admin Supabase client — bypasses RLS. Use only in trusted server code.
 * Falls back to anon key in development only when service role key is not set.
 */
export function createSupabaseAdmin() {
  if (process.env.NODE_ENV === "production" && !supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required in production for createSupabaseAdmin()"
    );
  }
  if (!supabaseServiceKey && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase-server] SUPABASE_SERVICE_ROLE_KEY not set — using anon key (dev only)"
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Verify a Bearer token and return the Supabase user.
 */
export async function getSupabaseUser(token: string) {
  const admin = createSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
