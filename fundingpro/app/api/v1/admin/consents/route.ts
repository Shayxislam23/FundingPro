export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listRecentConsents } from "@/lib/db/admin-consents";

// GET /api/v1/admin/consents?limit=50
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  try {
    const consents = await listRecentConsents(limit);
    return apiSuccess({ consents, total: consents.length });
  } catch (err) {
    console.error("GET /admin/consents error:", err);
    return apiError("Failed to list consents", 500, "INTERNAL_ERROR");
  }
}
