export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { updateAdminSupportTicketStatus } from "@/lib/db/admin-support";

const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();
  const { status } = body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return apiError("Invalid status", 400, "INVALID_STATUS");
  }

  await updateAdminSupportTicketStatus(id, status, admin.accessToken);

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_support_ticket_update",
    entityType: "support_ticket",
    entityId: id,
    metadata: { status },
  });

  return apiSuccess({ ticketId: id, status });
});
