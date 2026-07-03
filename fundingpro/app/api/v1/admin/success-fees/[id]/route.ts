export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { updateSuccessFeeStatus } from "@/lib/db/success-fees";

const STATUSES = new Set(["pending", "invoiced", "paid", "waived"]);

/** PATCH /api/v1/admin/success-fees/:id — move a fee record through the ledger. */
export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();
  if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
    return apiError("status must be one of pending, invoiced, paid, waived", 400, "INVALID_STATUS");
  }

  await updateSuccessFeeStatus(id, body.status, admin.accessToken);

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_success_fee_update",
    entityType: "success_fee_record",
    entityId: id,
    metadata: { status: body.status },
  });

  return apiSuccess({ updated: true });
});
