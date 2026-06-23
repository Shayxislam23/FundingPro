export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { getAdminDashboardStats } from "@/lib/db/admin-stats";

export const GET = withAdmin(async () => {
  const stats = await getAdminDashboardStats();
  return apiSuccess(stats);
});
