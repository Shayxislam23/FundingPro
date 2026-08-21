export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { saveGrant, unsaveGrant } from "@/lib/db/saved-opportunities";
import { getGrantById } from "@/lib/db/opportunities";

export const POST = withActiveUser(async (_req, authUser, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const grant = await getGrantById(id);
  if (!grant) {
    return apiError("Grant not found", 404, "NOT_FOUND");
  }

  await saveGrant(id, authUser.accessToken);

  await writeAuditLog({
    userId: authUser.userId,
    action: "grant_save",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ opportunityId: id, saved: true });
});

export const DELETE = withActiveUser(async (_req, authUser, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  await unsaveGrant(id, authUser.accessToken);

  await writeAuditLog({
    userId: authUser.userId,
    action: "grant_unsave",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ opportunityId: id, saved: false });
});
