export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { saveGrant, unsaveGrant } from "@/lib/db/saved-grants";
import { getGrantById } from "@/lib/db/grants";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

async function grantExists(grantId: string): Promise<boolean> {
  if (isLocalDatabaseEnabled()) {
    const grant = await getGrantById(grantId);
    return !!grant;
  }
  const supabase = createSupabaseAdmin();
  const { data } = await supabase.from("grants").select("id").eq("id", grantId).maybeSingle();
  return !!data;
}

export const POST = withActiveUser(async (_req, authUser, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  if (!(await grantExists(id))) {
    return apiError("Grant not found", 404, "NOT_FOUND");
  }

  await saveGrant(authUser.userId, id, authUser.accessToken);

  await writeAuditLog({
    userId: authUser.userId,
    action: "grant_save",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ grantId: id, saved: true });
});

export const DELETE = withActiveUser(async (_req, authUser, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  await unsaveGrant(authUser.userId, id, authUser.accessToken);

  await writeAuditLog({
    userId: authUser.userId,
    action: "grant_unsave",
    entityType: "grant",
    entityId: id,
  });

  return apiSuccess({ grantId: id, saved: false });
});
