export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { listUserDocuments, softDeleteDocument } from "@/lib/db/documents";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";

// GET /api/v1/documents
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const documents = await listUserDocuments(authUser.userId);
    return apiSuccess({ documents });
  } catch (err) {
    console.error("GET /documents error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// DELETE /api/v1/documents?id=xxx
export async function DELETE(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("id required", 400, "MISSING_ID");

  try {
    if (!isLocalDatabaseEnabled()) {
      const supabase = createSupabaseAdmin();
      const { data: doc } = await supabase
        .from("documents")
        .select("storage_key, user_id")
        .eq("id", id)
        .single();
      if (doc?.user_id === authUser.userId && doc.storage_key) {
        await supabase.storage.from("documents").remove([doc.storage_key]).catch(() => {});
      }
    }

    const deleted = await softDeleteDocument(authUser.userId, id);
    if (!deleted) return apiError("Not found", 404, "NOT_FOUND");

    await writeAuditLog({
      userId: authUser.userId,
      action: "document_delete",
      entityType: "document",
      entityId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /documents error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
