import { api, convexQuery } from "@/lib/convex-server";

export async function listApplicationsForAdmin(
  opts: { limit: number; status?: string },
  accessToken: string
) {
  return convexQuery(api.applications.listForAdmin, opts, accessToken);
}
