import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/me
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  // TODO: fetch user from database
  return apiSuccess({
    id: authUser.userId,
    // Never return full personal data: no PINFL, passport, raw phone in logs
    plan: "ngo_pro",
    organizationId: null,
  });
}
