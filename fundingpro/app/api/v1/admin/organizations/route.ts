export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listOrganizations } from "@/lib/db/organizations";

// GET /api/v1/admin/organizations
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const organizations = await listOrganizations(limit);
    return apiSuccess({ organizations, total: organizations.length });
  } catch (err) {
    console.error("GET /admin/organizations error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
