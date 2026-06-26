export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { getAdminDashboardStats } from "@/lib/db/admin-stats";

export const GET = withAdmin(async (_req, admin) => {
  const stats = await getAdminDashboardStats(admin.accessToken);
  return apiSuccess(stats);
});
