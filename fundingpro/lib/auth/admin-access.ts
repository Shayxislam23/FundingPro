import { getUserPlatformRole } from "@/lib/db/user-roles";

export {
  parseAdminEmails,
  isAdminBypassEnabled,
  isAdminEmail,
  getPlatformRoleEdge,
  canAccessAdminMiddleware,
} from "@/lib/auth/admin-access-edge";

import {
  isAdminBypassEnabled,
  isAdminEmail,
} from "@/lib/auth/admin-access-edge";

/**
 * Full admin check for API routes and server code (Convex platform role + ADMIN_EMAILS).
 */
export async function canAccessAdmin(
  accessToken: string,
  email: string | null | undefined
): Promise<boolean> {
  if (isAdminBypassEnabled()) return true;
  if (isAdminEmail(email)) return true;
  if ((await getUserPlatformRole(accessToken)) === "admin") return true;
  return false;
}
