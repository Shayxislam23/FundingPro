export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getDocumentById, getDocumentDownloadUrl } from "@/lib/db/documents";

export const GET = withActiveUser(async (_req, authUser, ctx) => {
  const id = ctx.params?.id;
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  await ensureInternalUser({
    email: authUser.email,
    provider: "clerk",
  }, authUser.accessToken);

  const doc = await getDocumentById(id, authUser.accessToken);
  if (!doc) return apiError("Document not found", 404, "NOT_FOUND");

  await writeAuditLog({
    userId: authUser.userId,
    action: "document_download",
    entityType: "document",
    entityId: doc.id,
    metadata: { fileName: doc.file_name },
  });

  if (!doc.storage_id) {
    return apiError("File not available in storage", 404, "FILE_NOT_FOUND");
  }

  const signedUrl = await getDocumentDownloadUrl(doc.storage_id, authUser.accessToken);
  if (!signedUrl) {
    return apiError("File not available in storage", 404, "FILE_NOT_FOUND");
  }

  return NextResponse.redirect(signedUrl);
});
