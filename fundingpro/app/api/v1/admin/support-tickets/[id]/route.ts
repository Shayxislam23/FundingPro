export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";

const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();
  const { status } = body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return apiError("Invalid status", 400, "INVALID_STATUS");
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "resolved" || status === "closed") {
    patch.resolved_at = new Date().toISOString();
  }

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `UPDATE support_tickets SET status = $2, updated_at = $3, resolved_at = COALESCE($4, resolved_at) WHERE id = $1::uuid`,
      [id, status, patch.updated_at, patch.resolved_at ?? null]
    );
  } else {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_support_ticket_update",
    entityType: "support_ticket",
    entityId: id,
    metadata: { status },
  });

  return apiSuccess({ ticketId: id, status });
});
