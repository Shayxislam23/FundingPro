/** Edge/middleware-safe admin helpers — no Node.js or pg imports. */

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminBypassEnabled(): boolean {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return false;
  }
  return process.env.ADMIN_BYPASS_DEV === "true";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isAdminBypassEnabled()) return true;
  return parseAdminEmails().includes(email.toLowerCase());
}

export async function getPlatformRoleEdge(_userId: string): Promise<"user" | "admin"> {
  // Middleware runs on Edge — full role lookup happens in API routes via Convex.
  return "user";
}

export async function canAccessAdminMiddleware(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (isAdminBypassEnabled()) return true;
  if (isAdminEmail(email)) return true;
  if ((await getPlatformRoleEdge(userId)) === "admin") return true;
  return false;
}
