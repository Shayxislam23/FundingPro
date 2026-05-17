import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/documents
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const supabase = createSupabaseAdmin();

    const { data: docs, error } = await supabase
      .from("documents")
      .select("id, file_name, mime_type, size_bytes, storage_key, status, created_at")
      .eq("user_id", authUser.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error && error.code === "42P01") {
      return apiSuccess({ documents: [] });
    }
    if (error) throw new Error(error.message);

    return apiSuccess({ documents: docs ?? [] });
  } catch (err) {
    console.error("GET /documents error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// DELETE /api/v1/documents?id=xxx
export async function DELETE(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("id required", 400, "MISSING_ID");

  try {
    const supabase = createSupabaseAdmin();

    const { data: doc, error: fetchErr } = await supabase
      .from("documents")
      .select("id, storage_key, user_id")
      .eq("id", id)
      .single();

    if (fetchErr || !doc) return apiError("Not found", 404, "NOT_FOUND");
    if (doc.user_id !== authUser.userId) return apiError("Forbidden", 403, "FORBIDDEN");

    // Remove from storage
    await supabase.storage.from("documents").remove([doc.storage_key]);

    // Soft-delete
    await supabase.from("documents").update({ status: "deleted" }).eq("id", id);

    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("DELETE /documents error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
