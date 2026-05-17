import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/subscriptions/current
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  // TODO: query active subscription for user
  return apiSuccess({
    subscription: null,
    plan: null,
    status: "none",
  });
}
