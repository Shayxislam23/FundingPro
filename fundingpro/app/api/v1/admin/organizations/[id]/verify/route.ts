export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { setOrganizationVerified } from "@/lib/db/organizations";

export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Organization id required", 400, "MISSING_FIELDS");

  const body = await req.json();
  const verified = body.verified === true;

  await setOrganizationVerified(id, verified, admin.accessToken);

  await writeAuditLog({
    userId: admin.userId,
    action: verified ? "admin_org_verify" : "admin_org_unverify",
    entityType: "organization",
    entityId: id,
  });

  return apiSuccess({ id, verified });
});
