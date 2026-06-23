export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getDocumentById } from "@/lib/db/documents";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { readLocalFile } from "@/lib/local-storage";

// GET /api/v1/documents/[id]/download
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    const doc = await getDocumentById(authUser.userId, params.id);
    if (!doc) return apiError("Document not found", 404, "NOT_FOUND");

    await writeAuditLog({
      userId: authUser.userId,
      action: "document_download",
      entityType: "document",
      entityId: doc.id,
      metadata: { fileName: doc.file_name },
    });

    if (isLocalDatabaseEnabled()) {
      const buffer = await readLocalFile(doc.storage_key);
      if (!buffer) return apiError("File not found in storage", 404, "FILE_NOT_FOUND");

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": doc.mime_type ?? "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
        },
      });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_key, 60);

    if (error || !data?.signedUrl) {
      return apiError("File not available in storage", 404, "FILE_NOT_FOUND");
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error("GET /documents/download error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
