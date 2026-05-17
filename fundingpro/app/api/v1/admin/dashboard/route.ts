import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/admin/dashboard
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  // TODO: check RBAC — admin role required
  // TODO: query database for dashboard stats

  return apiSuccess({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalGrants: 0,
    paymentsThisMonth: 0,
    aiRequestsThisMonth: 0,
    zoomradRevenue: {
      grossUsd: 0,
      zoomradShareUsd: 0,
      platformShareUsd: 0,
      transactionCount: 0,
      currentBucket: "0–500",
      rateZoomrad: 30,
      ratePlatform: 70,
    },
  });
}
