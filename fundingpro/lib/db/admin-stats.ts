import { api, convexQuery } from "@/lib/convex-server";

function getLocalMonthStart(): number {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart.getTime();
}

export async function getAdminDashboardStats(accessToken: string) {
  return convexQuery(
    api.adminStats.dashboard,
    { monthStart: getLocalMonthStart() },
    accessToken
  );
}
