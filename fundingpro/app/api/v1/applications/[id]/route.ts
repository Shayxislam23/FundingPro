export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser, writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

const ALLOWED_STATUSES = ["saved", "preparing", "drafting", "ready", "submitted", "under_review", "shortlisted", "won", "lost", "reporting", "closed"];

// PATCH /api/v1/applications/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const supabase = createSupabaseAdmin();
  const { data: app } = await supabase.from("applications").select("id, status, user_id").eq("id", params.id).single();
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if (app.user_id !== authUser.userId) return apiError("Forbidden", 403, "FORBIDDEN");

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (status && !ALLOWED_STATUSES.includes(status.toLowerCase())) {
      return apiError(`Invalid status`, 400, "INVALID_STATUS");
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) update.status = status.toLowerCase();
    if (notes !== undefined) update.notes = notes;

    const { data: updated, error } = await supabase
      .from("applications")
      .update(update)
      .eq("id", params.id)
      .select("id, status")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditLog({ userId: authUser.userId, action: "application_status_update", entityType: "application", entityId: params.id, metadata: { from: app.status, to: updated.status } });

    return apiSuccess({ applicationId: updated.id, status: updated.status });
  } catch (err) {
    console.error("PATCH /applications/[id] error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// DELETE /api/v1/applications/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const supabase = createSupabaseAdmin();
  const { data: app } = await supabase.from("applications").select("id, status, user_id, grant_id").eq("id", params.id).single();
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if (app.user_id !== authUser.userId) return apiError("Forbidden", 403, "FORBIDDEN");

  const locked = ["submitted", "under_review", "shortlisted", "won", "reporting"];
  if (locked.includes(app.status)) return apiError("Cannot delete a submitted or active application", 400, "CANNOT_DELETE");

  await supabase.from("applications").delete().eq("id", params.id);
  await writeAuditLog({ userId: authUser.userId, action: "application_delete", entityType: "application", entityId: params.id });

  return apiSuccess({ deleted: true });
}
