export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin, writeAuditLog } from "@/lib/auth-helpers";
import { updateGrant } from "@/lib/db/admin-grants";

// PATCH /api/v1/admin/grants/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let admin;
  try {
    admin = await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const body = await req.json();

    await updateGrant(params.id, {
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
      entityId: params.id,
    });

    return apiSuccess({ grantId: params.id, updated: true });
  } catch (err) {
    console.error("PATCH /admin/grants/[id] error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
