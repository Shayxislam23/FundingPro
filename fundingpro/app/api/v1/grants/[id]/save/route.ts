export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
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

// POST /api/v1/grants/:id/save
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    if (!(await grantExists(params.id))) {
      return apiError("Grant not found", 404, "NOT_FOUND");
    }

    await saveGrant(authUser.userId, params.id);

    await writeAuditLog({
      userId: authUser.userId,
      action: "grant_save",
      entityType: "grant",
      entityId: params.id,
    });

    return apiSuccess({ grantId: params.id, saved: true });
  } catch (err) {
    console.error("POST /grants/[id]/save error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// DELETE /api/v1/grants/:id/save
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    await unsaveGrant(authUser.userId, params.id);

    await writeAuditLog({
      userId: authUser.userId,
      action: "grant_unsave",
      entityType: "grant",
      entityId: params.id,
    });

    return apiSuccess({ grantId: params.id, saved: false });
  } catch (err) {
    console.error("DELETE /grants/[id]/save error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
