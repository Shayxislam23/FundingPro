import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST /api/v1/documents/upload
// SECURITY: No public document URLs. Audit log on every access.
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

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
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      return apiError("File type not allowed", 400, "INVALID_FILE_TYPE");
    }
    if (file.size > maxSizeBytes) {
      return apiError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");
    }

    const allowedDocTypes = ["CHARTER", "REGISTRATION", "FINANCIAL_REPORT", "CV", "SUPPORT_LETTER", "AUDIT_REPORT", "TAX_CERTIFICATE", "OTHER"];
    const normalizedDocType = allowedDocTypes.includes(docType.toUpperCase()) ? docType.toUpperCase() : "OTHER";

    // TODO: upload file bytes to secure private storage (Supabase Storage, private bucket)
    // For now, record metadata only — storage path placeholder
    const storagePath = `documents/${authUser.userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const document = await prisma.document.create({
      data: {
        userId: authUser.userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        docType: normalizedDocType as never,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "document_upload",
        entityType: "Document",
        entityId: document.id,
        metadata: { fileName: file.name, fileType: file.type, fileSize: file.size, docType: normalizedDocType },
      },
    });

    return apiSuccess({ documentId: document.id, fileName: document.fileName, docType: document.docType }, 201);
  } catch (err) {
    console.error("POST /documents/upload error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
