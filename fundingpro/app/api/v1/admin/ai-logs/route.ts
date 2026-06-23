export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listAiRequests } from "@/lib/db/admin-users";

// GET /api/v1/admin/ai-logs?page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  try {
    const result = await listAiRequests({ page, limit });
    return apiSuccess(result);
  } catch (err) {
    console.error("GET /admin/ai-logs error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
