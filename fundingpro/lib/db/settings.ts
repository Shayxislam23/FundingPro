import {
  api,
  convexInternalQuery,
  convexPublicQuery,
  internal,
} from "@/lib/convex-server";

export async function getSettingValue(key: string): Promise<string | null> {
  return convexInternalQuery(internal.settings.getByKeyInternal, { key });
}

export async function getPublicSettingValue(key: string): Promise<string | null> {
  return convexPublicQuery(api.settings.getPublicByKey, { key });
}
