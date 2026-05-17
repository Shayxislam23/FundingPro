import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/applications
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  // TODO: fetch applications for user from database
  return apiSuccess({ applications: [], total: 0 });
}

// POST /api/v1/applications
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { grantId } = body;

    if (!grantId) return apiError("grantId required", 400, "MISSING_FIELDS");

    // TODO: create Application record with status=SAVED
    // TODO: write audit log: action="application_status_update"

    return apiSuccess({ applicationId: "TODO_ID", status: "SAVED" }, 201);
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
