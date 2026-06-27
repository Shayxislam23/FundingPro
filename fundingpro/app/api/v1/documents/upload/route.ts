export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { insertDocument, DOCUMENT_TYPES } from "@/lib/db/documents";
import { convexMutation } from "@/lib/convex-server";
import { api } from "@/lib/convex-server";
import { saveLocalFile, deleteLocalFile } from "@/lib/local-storage";
import { sanitizeStorageFileName } from "@fundingpro/shared";
import { validateFileContent, isAllowedUploadMime } from "@/lib/file-sniff";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export const POST = withActiveUser(async (req, authUser) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = (formData.get("docType") as string | null) ?? "OTHER";

  if (!file) return apiError("file required", 400, "MISSING_FILE");

  if (!isAllowedUploadMime(file.type)) {
    return apiError("File type not allowed", 400, "INVALID_FILE_TYPE");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError(`File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`, 400, "FILE_TOO_LARGE");
  }

  const fileBytes = await file.arrayBuffer();
  const contentError = validateFileContent(file.type, fileBytes);
  if (contentError) {
    return apiError(contentError, 400, "INVALID_FILE_CONTENT");
  }

  const normalizedDocType = DOCUMENT_TYPES.includes(docType as (typeof DOCUMENT_TYPES)[number])
    ? docType
    : "OTHER";

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const safeName = sanitizeStorageFileName(file.name);
  const storagePath = `${authUser.userId}/${crypto.randomUUID()}-${safeName}`;

  let storageId: string | undefined;
  const useLocal = process.env.USE_LOCAL_FILE_STORAGE === "true";

  if (useLocal) {
    await saveLocalFile(storagePath, fileBytes);
  } else {
    if (!authUser.accessToken) {
      return apiError("Missing access token for storage upload", 401, "UNAUTHORIZED");
    }
    const uploadUrl = await convexMutation(
      api.documents.generateUploadUrl,
      {},
      authUser.accessToken
    );
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: fileBytes,
    });
    if (!uploadRes.ok) {
      return apiError("Failed to upload file to storage", 503, "STORAGE_UPLOAD_FAILED");
    }
    const uploadJson = (await uploadRes.json()) as { storageId: string };
    storageId = uploadJson.storageId;
  }

  let documentId: string;
  try {
    documentId = await insertDocument(
      {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: storagePath,
        docType: normalizedDocType,
        storageId,
      },
      authUser.accessToken
    );
  } catch (dbErr) {
    if (useLocal) {
      await deleteLocalFile(storagePath);
    }
    throw dbErr;
  }

  await writeAuditLog({
    userId: authUser.userId,
    action: "document_upload",
    entityType: "document",
    entityId: documentId,
    metadata: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      docType: normalizedDocType,
      storageId,
    },
  });

  return apiSuccess(
    {
      documentId,
      fileName: file.name,
      storageNote: useLocal ? "local_filesystem" : "convex_storage",
    },
    201
  );
});
