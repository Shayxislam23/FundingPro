export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin, writeAuditLog } from "@/lib/auth-helpers";
import { setOrganizationVerified } from "@/lib/db/organizations";

// PATCH /api/v1/admin/organizations/[id]/verify { verified: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const verified = body.verified === true;

    if (!id) return apiError("Organization id required", 400, "MISSING_FIELDS");

    await setOrganizationVerified(id, verified);

    await writeAuditLog({
      userId: admin.userId,
      action: verified ? "admin_org_verify" : "admin_org_unverify",
      entityType: "organization",
      entityId: id,
    });

    return apiSuccess({ id, verified });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /admin/organizations/[id]/verify error:", e);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
