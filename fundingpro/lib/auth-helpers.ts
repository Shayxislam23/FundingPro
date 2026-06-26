import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { apiError } from "./api";
import { convexInternalMutation, convexQuery } from "./convex-server";
import { api, internal } from "./convex-server";
import { getUserAccountStatus } from "./db/user-status";
import {
  canAccessAdmin,
  isAdminEmail,
  parseAdminEmails,
} from "./auth/admin-access";

export type AuthUser = {
  clerkUserId: string;
  userId: string;
  email: string | null;
  accessToken: string;
};

export { isAdminEmail, parseAdminEmails };

export async function isAdminUser(
  accessToken: string,
  email: string | null | undefined
): Promise<boolean> {
  return canAccessAdmin(accessToken, email);
}

/** Bearer token from Authorization header or Clerk session (Convex JWT). */
export async function getAccessToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  try {
    const session = await auth();
    if (!session?.userId) return null;
    return (await session.getToken({ template: "convex" })) ?? null;
  } catch {
    return null;
  }
}

async function resolveUserFromToken(accessToken: string): Promise<AuthUser | null> {
  try {
    const me = await convexQuery(api.users.getMe, {}, accessToken);
    if (!me.isActive || me.isBanned) return null;
    return {
      clerkUserId: me.clerkId,
      userId: me.id,
      email: me.email,
      accessToken,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  try {
    const session = await auth();
    const clerkUserId = session?.userId;
    if (!clerkUserId) {
      if (bearerToken) {
        return resolveUserFromToken(bearerToken);
      }
      return null;
    }

    const token = bearerToken ?? (await session.getToken({ template: "convex" }));
    if (!token) return null;

    const me = await convexQuery(api.users.getMe, {}, token);
    if (!me.isActive || me.isBanned) return null;

    return {
      clerkUserId,
      userId: me.id,
      email: me.email ?? ((session.sessionClaims?.email as string | null) ?? null),
      accessToken: token,
    };
  } catch {
    if (bearerToken) {
      return resolveUserFromToken(bearerToken);
    }
    return null;
  }
}

export async function getCurrentUserOrThrow(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) throw apiError("Unauthorized", 401, "UNAUTHORIZED");
  return user;
}

export async function assertUserAccountActive(accessToken: string): Promise<void> {
  const status = await getUserAccountStatus(accessToken);
  if (status.isBanned) {
    throw apiError("Account banned", 403, "ACCOUNT_BANNED");
  }
  if (!status.isActive) {
    throw apiError("Account disabled", 403, "ACCOUNT_DISABLED");
  }
}

export async function requireActiveUser(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUserOrThrow(req);
  await assertUserAccountActive(user.accessToken);
  return user;
}

export async function requireActiveUserOrResponse(
  req: NextRequest
): Promise<AuthUser | Response> {
  try {
    return await requireActiveUser(req);
  } catch (e) {
    return e as Response;
  }
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireActiveUser(req);
  if (!(await isAdminUser(user.accessToken, user.email))) {
    throw apiError("Forbidden", 403, "FORBIDDEN");
  }
  return user;
}

export async function writeAuditLog(params: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await convexInternalMutation(internal.audit.write, {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
  } catch (err) {
    console.warn("Failed to write audit log", {
      action: params.action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
