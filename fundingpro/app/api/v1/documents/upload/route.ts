export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { insertDocument, DOCUMENT_TYPES } from "@/lib/db/documents";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { saveLocalFile, deleteLocalFile } from "@/lib/local-storage";
import { sanitizeStorageFileName } from "@/lib/validation";

// POST /api/v1/documents/upload
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string | null) ?? "OTHER";

    if (!file) return apiError("file required", 400, "MISSING_FILE");

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return apiError("File type not allowed", 400, "INVALID_FILE_TYPE");
    }
    if (file.size > 10 * 1024 * 1024) {
      return apiError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");
    }

    const normalizedDocType = DOCUMENT_TYPES.includes(docType as (typeof DOCUMENT_TYPES)[number])
      ? docType
      : "OTHER";

    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    const safeName = sanitizeStorageFileName(file.name);
    const storagePath = `${authUser.userId}/${crypto.randomUUID()}-${safeName}`;
    const fileBytes = await file.arrayBuffer();

    if (isLocalDatabaseEnabled()) {
      await saveLocalFile(storagePath, fileBytes);
    } else {
      const supabase = createSupabaseAdmin();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, fileBytes, { contentType: file.type, upsert: false });

      if (uploadError && !uploadError.message?.includes("Bucket not found")) {
        throw new Error(uploadError.message);
      }
      if (uploadError?.message?.includes("Bucket not found")) {
        console.warn("Storage bucket 'documents' not found — recording metadata only");
      }
    }

    let documentId: string;
    try {
      documentId = await insertDocument({
        userId: authUser.userId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: storagePath,
        docType: normalizedDocType,
      });
    } catch (dbErr) {
      if (isLocalDatabaseEnabled()) {
        await deleteLocalFile(storagePath);
      } else {
        const supabase = createSupabaseAdmin();
        await supabase.storage.from("documents").remove([storagePath]);
      }
      throw dbErr;
    }

    await writeAuditLog({
      userId: authUser.userId,
      action: "document_upload",
      entityType: "document",
      entityId: documentId,
      metadata: { fileName: file.name, fileType: file.type, fileSize: file.size, docType: normalizedDocType },
    });

    return apiSuccess(
      {
        documentId,
        fileName: file.name,
        storageNote: isLocalDatabaseEnabled()
          ? "local_filesystem"
          : "supabase_storage_or_metadata",
      },
      201
    );
  } catch (err) {
    console.error("POST /documents/upload error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
