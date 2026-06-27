export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { updateGrant } from "@/lib/db/admin-grants";

export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();

  await updateGrant(
    id,
    {
      title: body.title?.trim(),
      description: body.description?.trim(),
      isActive: body.isActive,
      isFeatured: body.isFeatured,
    },
    admin.accessToken
  );

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_grant_update",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ grantId: id, updated: true });
});
