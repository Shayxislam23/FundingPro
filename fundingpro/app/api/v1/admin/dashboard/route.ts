export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminDashboardStats } from "@/lib/db/admin-stats";

// GET /api/v1/admin/dashboard
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const stats = await getAdminDashboardStats();
    return apiSuccess(stats);
  } catch (err) {
    console.error("GET /admin/dashboard error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
