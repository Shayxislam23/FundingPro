import { api, convexQuery } from "@/lib/convex-server";

export async function getAdminDashboardStats(accessToken: string) {
  return convexQuery(api.adminStats.dashboard, {}, accessToken);
}
