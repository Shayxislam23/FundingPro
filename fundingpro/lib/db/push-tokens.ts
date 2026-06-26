import { api, convexMutation } from "@/lib/convex-server";

export type PushPlatform = "ios" | "android";

export type RegisterPushTokenResult = {
  id: string;
  token: string;
  platform: PushPlatform;
  updatedAt: string;
};

export async function registerPushToken(
  input: {
    token: string;
    platform: PushPlatform;
  },
  accessToken: string
): Promise<RegisterPushTokenResult> {
  return convexMutation(api.pushTokens.upsert, input, accessToken);
}
