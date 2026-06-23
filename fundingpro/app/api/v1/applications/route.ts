export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import {
  listApplications,
  createApplication,
} from "@/lib/db/applications";
import { parsePagination } from "@/lib/validation";

// GET /api/v1/applications
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const { page, limit } = parsePagination(searchParams);

  try {
    const result = await listApplications(authUser.userId, { status: status || undefined, page, limit });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /applications error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// POST /api/v1/applications
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const { grantId, notes } = body;
    if (!grantId || typeof grantId !== "string") return apiError("grantId required", 400, "MISSING_FIELDS");
    if (notes !== undefined && (typeof notes !== "string" || notes.length > 5000)) {
      return apiError("notes must be a string up to 5000 chars", 400, "INVALID_NOTES");
    }

    await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      provider: "supabase_email",
    });

    const normalizedNotes =
      notes === undefined ? undefined : typeof notes === "string" ? notes.trim() || null : null;

    const result = await createApplication(authUser.userId, grantId, normalizedNotes);
    if ("error" in result && result.error === "GRANT_NOT_FOUND") {
      return apiError("Grant not found", 404, "GRANT_NOT_FOUND");
    }

    if (!result.alreadyExists) {
      await writeAuditLog({
        userId: authUser.userId,
        action: "application_create",
        entityType: "application",
        entityId: result.applicationId,
        metadata: { grantId },
      });
    }

    return apiSuccess(
      { applicationId: result.applicationId, status: result.status, alreadyExists: result.alreadyExists },
      result.alreadyExists ? 200 : 201
    );
  } catch (err) {
    console.error("POST /applications error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
