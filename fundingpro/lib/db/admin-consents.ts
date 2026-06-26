import { api, convexQuery } from "@/lib/convex-server";

export async function listRecentConsents(limit: number, accessToken: string) {
  return convexQuery(api.consents.listRecent, { limit }, accessToken);
}
