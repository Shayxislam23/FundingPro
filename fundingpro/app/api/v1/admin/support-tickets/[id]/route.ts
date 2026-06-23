export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin, writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";

const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

// PATCH /api/v1/admin/support-tickets/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let admin;
  try {
    admin = await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
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
        [params.id, status, patch.updated_at, patch.resolved_at ?? null]
      );
    } else {
      const supabase = createSupabaseAdmin();
      const { error } = await supabase.from("support_tickets").update(patch).eq("id", params.id);
      if (error) throw new Error(error.message);
    }

    await writeAuditLog({
      userId: admin.userId,
      action: "admin_support_ticket_update",
      entityType: "support_ticket",
      entityId: params.id,
      metadata: { status },
    });

    return apiSuccess({ ticketId: params.id, status });
  } catch (err) {
    console.error("PATCH /admin/support-tickets/[id] error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
