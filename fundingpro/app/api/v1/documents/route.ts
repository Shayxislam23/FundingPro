export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { listUserDocuments, softDeleteDocument } from "@/lib/db/documents";
import { withDatabase, getDbMode } from "@/lib/db/runtime";

export const GET = withActiveUser(async (_req, authUser) => {
  const documents = await listUserDocuments(authUser.userId, authUser.accessToken);
  return apiSuccess({ documents });
});

export const DELETE = withActiveUser(async (req, authUser) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("id required", 400, "MISSING_ID");

  if (getDbMode() === "supabase") {
    await withDatabase(
      async () => {},
      async (supabase) => {
        const { data: doc } = await supabase
          .from("documents")
          .select("storage_key, user_id")
          .eq("id", id)
          .single();
        if (doc?.user_id === authUser.userId && doc.storage_key) {
          await supabase.storage.from("documents").remove([doc.storage_key]).catch(() => {});
        }
      }
    );
  }

  const deleted = await softDeleteDocument(authUser.userId, id, authUser.accessToken);
  if (!deleted) return apiError("Not found", 404, "NOT_FOUND");

  await writeAuditLog({
    userId: authUser.userId,
    action: "document_delete",
    entityType: "document",
    entityId: id,
  });

  return apiSuccess({ deleted: true });
});
