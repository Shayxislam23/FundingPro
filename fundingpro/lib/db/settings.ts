import { api, convexPublicQuery } from "@/lib/convex-server";

export async function getSettingValue(key: string): Promise<string | null> {
  return convexPublicQuery(api.settings.getByKey, { key });
}
