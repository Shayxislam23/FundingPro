import { api, convexQuery } from "@/lib/convex-server";

export async function matchGrantsFromDatabase(
  profile: Record<string, unknown>,
  accessToken: string,
  limit?: number
) {
  return convexQuery(api.matchGrants.match, { profile, limit }, accessToken);
}
