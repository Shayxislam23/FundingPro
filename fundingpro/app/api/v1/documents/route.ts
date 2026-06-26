export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { listUserDocuments, softDeleteDocument } from "@/lib/db/documents";

export const GET = withActiveUser(async (_req, authUser) => {
  const documents = await listUserDocuments(authUser.accessToken);
  return apiSuccess({ documents });
});

export const DELETE = withActiveUser(async (req, authUser) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("id required", 400, "MISSING_ID");

  const deleted = await softDeleteDocument(id, authUser.accessToken);
  if (!deleted) return apiError("Not found", 404, "NOT_FOUND");

  await writeAuditLog({
    userId: authUser.userId,
    action: "document_delete",
    entityType: "document",
    entityId: id,
  });

  return apiSuccess({ deleted: true });
});
