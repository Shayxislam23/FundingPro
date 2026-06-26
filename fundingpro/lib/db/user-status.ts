import { api, convexQuery } from "@/lib/convex-server";

export type UserAccountStatus = { isActive: boolean; isBanned: boolean };

export async function getUserAccountStatus(accessToken: string): Promise<UserAccountStatus> {
  return convexQuery(api.users.getAccountStatus, {}, accessToken);
}
