export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminPaymentsReport } from "@/lib/db/admin-payments";

// GET /api/v1/admin/payments
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const report = await getAdminPaymentsReport();
    return apiSuccess(report);
  } catch (err) {
    console.error("GET /admin/payments error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
