export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActivationFunnel } from "@/lib/db/admin-funnel";

// GET /api/v1/admin/funnel?recent30d=true
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const last30DaysSignups = searchParams.get("recent30d") === "true";

  try {
    const funnel = await getActivationFunnel({ last30DaysSignups });
    return apiSuccess({ funnel });
  } catch (err) {
    console.error("GET /admin/funnel error:", err);
    return apiError("Failed to load funnel", 500, "INTERNAL_ERROR");
  }
}
