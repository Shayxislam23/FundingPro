import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// POST /api/v1/documents/upload
// SECURITY: No public document URLs. Audit log on every access.
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string | null;

    if (!file) return apiError("file required", 400, "MISSING_FILE");

    // File upload validation
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      return apiError("File type not allowed", 400, "INVALID_FILE_TYPE");
    }
    if (file.size > maxSizeBytes) {
      return apiError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");
    }

    // TODO: upload to secure private storage (no public URL)
    // TODO: create Document record in database
    // TODO: write audit log: action="document_upload"

    return apiSuccess({ documentId: "TODO_ID" }, 201);
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
