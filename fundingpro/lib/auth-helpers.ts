import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser, createSupabaseAdmin, createSupabaseServerClient } from "./supabase-server";
import { isLocalDatabaseEnabled, getPgPool } from "./pg-pool";
import { apiError } from "./api";
import { getUserAccountStatus } from "./db/user-status";

export type AuthUser = {
  supabaseId: string;
  userId: string;
  email: string | null;
};

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (process.env.ADMIN_BYPASS_DEV === "true" && process.env.NODE_ENV !== "production") {
    return true;
  }
  return parseAdminEmails().includes(email.toLowerCase());
}

/**
 * Extract and verify Supabase JWT from Authorization header or session cookies.
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const user = await getSupabaseUser(token);
    if (user) {
      return {
        supabaseId: user.id,
        userId: user.id,
        email: user.email ?? null,
      };
    }
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        supabaseId: user.id,
        userId: user.id,
        email: user.email ?? null,
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function getCurrentUserOrThrow(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) throw apiError("Unauthorized", 401, "UNAUTHORIZED");
  return user;
}

export async function assertUserAccountActive(userId: string): Promise<void> {
  const status = await getUserAccountStatus(userId);
  if (status.isBanned) {
    throw apiError("Account banned", 403, "ACCOUNT_BANNED");
  }
  if (!status.isActive) {
    throw apiError("Account disabled", 403, "ACCOUNT_DISABLED");
  }
}

/** Authenticated user with active, non-banned account — use on all protected API routes. */
export async function requireActiveUser(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUserOrThrow(req);
  await assertUserAccountActive(user.userId);
  return user;
}

/** Same as requireActiveUser but returns NextResponse on auth/account errors (for route handlers). */
export async function requireActiveUserOrResponse(
  req: NextRequest
): Promise<AuthUser | NextResponse> {
  try {
    return await requireActiveUser(req);
  } catch (e) {
    return e as NextResponse;
  }
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireActiveUser(req);
  if (!isAdminEmail(user.email)) {
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
  if (isLocalDatabaseEnabled()) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
         VALUES ($1::uuid, $2, $3, $4, $5::jsonb)`,
        [
          params.userId,
          params.action,
          params.entityType ?? null,
          params.entityId ?? null,
          JSON.stringify(params.metadata ?? null),
        ]
      );
    } catch (err) {
      console.warn("Failed to write audit log", {
        action: params.action,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });

  if (error) {
    console.warn("Failed to write audit log", { action: params.action, error: error.message });
  }
}
