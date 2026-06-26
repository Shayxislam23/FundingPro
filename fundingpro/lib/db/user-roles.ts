import { api, convexQuery } from "@/lib/convex-server";

export type PlatformRole = "user" | "admin";

export async function getUserPlatformRole(accessToken: string): Promise<PlatformRole> {
  return convexQuery(api.users.getPlatformRole, {}, accessToken);
}
