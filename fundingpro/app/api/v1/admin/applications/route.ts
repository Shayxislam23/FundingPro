export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listApplicationsForAdmin } from "@/lib/db/admin-applications";

// GET /api/v1/admin/applications?limit=50&status=
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const status = searchParams.get("status") ?? undefined;

  try {
    const result = await listApplicationsForAdmin({ limit, status });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /admin/applications error:", err);
    return apiError("Failed to list applications", 500, "INTERNAL_ERROR");
  }
}
