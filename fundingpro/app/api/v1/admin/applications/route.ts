export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listApplicationsForAdmin } from "@/lib/db/admin-applications";

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const status = searchParams.get("status") ?? undefined;

  const result = await listApplicationsForAdmin({ limit, status }, admin.accessToken);
  return apiSuccess(result);
});
