import { api, convexQuery } from "@/lib/convex-server";

export async function getAdminPaymentsReport(accessToken: string) {
  return convexQuery(api.payments.adminReport, {}, accessToken);
}
