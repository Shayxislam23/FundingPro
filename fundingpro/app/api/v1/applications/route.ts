export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { listApplications, createApplication } from "@/lib/db/applications";
import { parsePagination } from "@/lib/validation";

export const GET = withActiveUser(async (req, authUser) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const { page, limit } = parsePagination(searchParams);

  const result = await listApplications(
    { status: status || undefined, page, limit },
    authUser.accessToken
  );
  return apiSuccess(result);
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { grantId, notes } = body;
  if (!grantId || typeof grantId !== "string") {
    return apiError("grantId required", 400, "MISSING_FIELDS");
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 5000)) {
    return apiError("notes must be a string up to 5000 chars", 400, "INVALID_NOTES");
  }

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const normalizedNotes =
    notes === undefined ? undefined : typeof notes === "string" ? notes.trim() || null : null;

  const result = await createApplication(grantId, normalizedNotes, authUser.accessToken);
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
});
