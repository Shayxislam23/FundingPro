import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function readSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  return { url, anonKey };
}

function createClient(): SupabaseClient {
  const { url, anonKey } = readSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createBrowserClient(url, anonKey);
}

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!client) client = createClient();
  return client;
}

/** Lazy client — avoids build failure when env vars are not yet set on Vercel */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getSupabase();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(c)
      : value;
  },
});
