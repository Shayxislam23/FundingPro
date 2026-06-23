export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import {
  getApplicationForUser,
  updateApplication,
  deleteApplication,
} from "@/lib/db/applications";

const ALLOWED_STATUSES = [
  "saved",
  "preparing",
  "drafting",
  "ready",
  "submitted",
  "under_review",
  "shortlisted",
  "won",
  "lost",
  "reporting",
  "closed",
];

const LOCKED_STATUSES = ["submitted", "under_review", "shortlisted", "won", "reporting"];

// PATCH /api/v1/applications/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const app = await getApplicationForUser(authUser.userId, params.id);
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if ("forbidden" in app) return apiError("Forbidden", 403, "FORBIDDEN");

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (status !== undefined && typeof status !== "string") {
      return apiError("Invalid status", 400, "INVALID_STATUS");
    }
    if (notes !== undefined && (typeof notes !== "string" || notes.length > 5000)) {
      return apiError("notes must be a string up to 5000 chars", 400, "INVALID_NOTES");
    }

    if (status && !ALLOWED_STATUSES.includes(status.toLowerCase())) {
      return apiError("Invalid status", 400, "INVALID_STATUS");
    }

    const updated = await updateApplication(authUser.userId, params.id, {
      status: status ? status.toLowerCase() : undefined,
      notes: notes !== undefined ? notes.trim() || null : undefined,
    });

    if (!updated) return apiError("Not found", 404, "NOT_FOUND");

    await writeAuditLog({
      userId: authUser.userId,
      action: "application_status_update",
      entityType: "application",
      entityId: params.id,
      metadata: { from: app.status, to: updated.status },
    });

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
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const app = await getApplicationForUser(authUser.userId, params.id);
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if ("forbidden" in app) return apiError("Forbidden", 403, "FORBIDDEN");

  if (LOCKED_STATUSES.includes(app.status)) {
    return apiError("Cannot delete a submitted or active application", 400, "CANNOT_DELETE");
  }

  await deleteApplication(authUser.userId, params.id);
  await writeAuditLog({
    userId: authUser.userId,
    action: "application_delete",
    entityType: "application",
    entityId: params.id,
  });

  return apiSuccess({ deleted: true });
}
