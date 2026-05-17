import { NextRequest } from "next/server";
import { getSupabaseUser, createSupabaseAdmin } from "./supabase-server";
import { apiError } from "./api";

export type AuthUser = {
  supabaseId: string;
  userId: string; // same as supabaseId — Supabase is the user store
  email: string | null;
};

/**
 * Extract and verify Supabase JWT from Authorization header.
 * Returns AuthUser or null.
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const user = await getSupabaseUser(token);
  if (!user) return null;

  return {
    supabaseId: user.id,
    userId: user.id,
    email: user.email ?? null,
  };
}

/**
 * Like getCurrentUser but throws 401 if not authenticated.
 */
export async function getCurrentUserOrThrow(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) throw apiError("Unauthorized", 401, "UNAUTHORIZED");
  return user;
}

/**
 * Require admin role — checks ADMIN_EMAILS env var.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUserOrThrow(req);
  if (process.env.NODE_ENV === "production") {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    if (!user.email || !adminEmails.includes(user.email)) {
      throw apiError("Forbidden", 403, "FORBIDDEN");
    }
  }
  return user;
}

/**
 * Write an audit log entry via Supabase.
 */
export async function writeAuditLog(params: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  }).then(() => {}); // non-blocking fire-and-forget
}
