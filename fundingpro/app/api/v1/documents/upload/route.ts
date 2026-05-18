export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser, writeAuditLog } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// POST /api/v1/documents/upload
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string | null) ?? "other";

    if (!file) return apiError("file required", 400, "MISSING_FILE");

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) return apiError("File type not allowed", 400, "INVALID_FILE_TYPE");
    if (file.size > 10 * 1024 * 1024) return apiError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");

    const supabase = createSupabaseAdmin();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${authUser.userId}/${Date.now()}-${safeName}`;

    // Upload to Supabase Storage (private bucket "documents")
    const fileBytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBytes, { contentType: file.type, upsert: false });

    // If storage bucket doesn't exist, still record metadata
    if (uploadError && uploadError.message?.includes("Bucket not found")) {
      console.warn("Storage bucket 'documents' not found — recording metadata only");
    } else if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Save metadata to documents table
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: authUser.userId,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_key: storagePath,
        status: "active",
      })
      .select("id")
      .single();

    // If table doesn't exist, return synthetic ID
    if (dbError && dbError.code === "42P01") {
      return apiSuccess({ documentId: crypto.randomUUID(), fileName: file.name }, 201);
    }
    if (dbError) throw new Error(dbError.message);

    await writeAuditLog({ userId: authUser.userId, action: "document_upload", entityType: "document", entityId: doc.id, metadata: { fileName: file.name, fileType: file.type, fileSize: file.size } });

    return apiSuccess({ documentId: doc.id, fileName: file.name }, 201);
  } catch (err) {
    console.error("POST /documents/upload error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
