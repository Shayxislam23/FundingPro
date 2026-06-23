export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { updateGrant } from "@/lib/db/admin-grants";

export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();

  await updateGrant(id, {
    title: body.title?.trim(),
    titleRu: body.titleRu?.trim(),
    description: body.description?.trim(),
    donorId: body.donorId,
    sectors: body.sectors,
    countryScope: body.countryScope,
    amountMin: body.amountMin != null ? Number(body.amountMin) : undefined,
    amountMax: body.amountMax != null ? Number(body.amountMax) : undefined,
    deadline: body.deadline,
    sourceUrl: body.sourceUrl?.trim(),
    isActive: body.isActive,
    isFeatured: body.isFeatured,
  });

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_grant_update",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ grantId: id, updated: true });
});
