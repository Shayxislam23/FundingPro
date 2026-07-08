import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export type UserMode = "individual" | "mentor" | "admin";

export async function getUserMode(accessToken: string): Promise<UserMode> {
  return convexQuery(api.users.getUserMode, {}, accessToken);
}

export async function setUserMode(
  userMode: "individual",
  accessToken: string
): Promise<UserMode> {
  return convexMutation(api.users.setUserMode, { userMode }, accessToken);
}
