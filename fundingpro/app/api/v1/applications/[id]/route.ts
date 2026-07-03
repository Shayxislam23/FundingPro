export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
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

export const GET = withActiveUser(async (_req, authUser, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const app = await getApplicationForUser(id, authUser.accessToken);
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if ("forbidden" in app) return apiError("Forbidden", 403, "FORBIDDEN");

  return apiSuccess(app);
});

export const PATCH = withActiveUser(async (req, authUser, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const app = await getApplicationForUser(id, authUser.accessToken);
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if ("forbidden" in app) return apiError("Forbidden", 403, "FORBIDDEN");

  const body = await req.json();
  const { status, notes, wonAmountUsd } = body;

  if (status !== undefined && typeof status !== "string") {
    return apiError("Invalid status", 400, "INVALID_STATUS");
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 5000)) {
    return apiError("notes must be a string up to 5000 chars", 400, "INVALID_NOTES");
  }

  if (status && !ALLOWED_STATUSES.includes(status.toLowerCase())) {
    return apiError("Invalid status", 400, "INVALID_STATUS");
  }

  if (
    wonAmountUsd !== undefined &&
    (typeof wonAmountUsd !== "number" || !Number.isFinite(wonAmountUsd) || wonAmountUsd <= 0)
  ) {
    return apiError("wonAmountUsd must be a positive number", 400, "INVALID_AMOUNT");
  }

  const updated = await updateApplication(
    id,
    {
      status: status ? status.toLowerCase() : undefined,
      notes: notes !== undefined ? notes.trim() || null : undefined,
      wonAmountUsd,
    },
    authUser.accessToken
  );

  if (!updated) return apiError("Not found", 404, "NOT_FOUND");

  await writeAuditLog({
    userId: authUser.userId,
    action: "application_status_update",
    entityType: "application",
    entityId: id,
    metadata: { from: app.status, to: updated.status },
  });

  return apiSuccess({ applicationId: updated.id, status: updated.status });
});

export const DELETE = withActiveUser(async (req, authUser, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const app = await getApplicationForUser(id, authUser.accessToken);
  if (!app) return apiError("Not found", 404, "NOT_FOUND");
  if ("forbidden" in app) return apiError("Forbidden", 403, "FORBIDDEN");

  if (LOCKED_STATUSES.includes(app.status)) {
    return apiError("Cannot delete a submitted or active application", 400, "CANNOT_DELETE");
  }

  await deleteApplication(id, authUser.accessToken);
  await writeAuditLog({
    userId: authUser.userId,
    action: "application_delete",
    entityType: "application",
    entityId: id,
  });

  return apiSuccess({ deleted: true });
});
