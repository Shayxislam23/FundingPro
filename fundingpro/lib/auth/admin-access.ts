import { getUserPlatformRole } from "@/lib/db/user-roles";

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminBypassEnabled(): boolean {
  return (
    process.env.ADMIN_BYPASS_DEV === "true" && process.env.NODE_ENV !== "production"
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isAdminBypassEnabled()) return true;
  return parseAdminEmails().includes(email.toLowerCase());
}

/** Edge-safe platform_role lookup via Supabase REST (no pg import). */
export async function getPlatformRoleEdge(userId: string): Promise<"user" | "admin"> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "user";

  try {
    const res = await fetch(
      `${url}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=platform_role&deleted_at=is.null`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return "user";
    const rows = (await res.json()) as { platform_role?: string }[];
    return rows[0]?.platform_role === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}

/**
 * Full admin check for API routes and server code (supports local PG via withDatabase).
 */
export async function canAccessAdmin(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (isAdminBypassEnabled()) return true;
  if (isAdminEmail(email)) return true;
  if ((await getUserPlatformRole(userId)) === "admin") return true;
  return false;
}

/**
 * Middleware-safe admin check — uses Supabase REST on edge; avoids pg imports.
 */
export async function canAccessAdminMiddleware(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (isAdminBypassEnabled()) return true;
  if (isAdminEmail(email)) return true;
  if ((await getPlatformRoleEdge(userId)) === "admin") return true;
  return false;
}
