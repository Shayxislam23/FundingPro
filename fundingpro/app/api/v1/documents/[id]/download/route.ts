export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getDocumentById } from "@/lib/db/documents";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { readLocalFile } from "@/lib/local-storage";

export const GET = withActiveUser(async (_req, authUser, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  await ensureInternalUser({
    supabaseId: authUser.supabaseId,
    email: authUser.email,
    provider: "supabase_email",
  });

  const doc = await getDocumentById(authUser.userId, id, authUser.accessToken);
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
});
