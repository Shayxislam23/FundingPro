import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = [
  "SAVED", "PREPARING", "DRAFTING", "READY", "SUBMITTED",
  "UNDER_REVIEW", "SHORTLISTED", "WON", "LOST", "REPORTING", "CLOSED",
];

// PATCH /api/v1/applications/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { id } = params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return apiError("Application not found", 404, "NOT_FOUND");
  if (application.userId !== authUser.userId) return apiError("Forbidden", 403, "FORBIDDEN");

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return apiError(`Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`, 400, "INVALID_STATUS");
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(status && { status, ...(status === "SUBMITTED" && { submittedAt: new Date() }) }),
        ...(notes !== undefined && { notes }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "application_status_update",
        entityType: "Application",
        entityId: id,
        metadata: { previousStatus: application.status, newStatus: updated.status },
      },
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
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { id } = params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return apiError("Application not found", 404, "NOT_FOUND");
  if (application.userId !== authUser.userId) return apiError("Forbidden", 403, "FORBIDDEN");

  // Only allow deletion if not yet submitted
  if (["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "WON", "REPORTING"].includes(application.status)) {
    return apiError("Cannot delete a submitted or active application", 400, "CANNOT_DELETE");
  }

  await prisma.application.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: authUser.userId,
      action: "application_delete",
      entityType: "Application",
      entityId: id,
      metadata: { grantId: application.grantId, status: application.status },
    },
  });

  return apiSuccess({ deleted: true });
}
