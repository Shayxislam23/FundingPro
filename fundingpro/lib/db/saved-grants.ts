import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function listSavedGrantIds(accessToken: string): Promise<string[]> {
  return convexQuery(api.savedGrants.listIds, {}, accessToken);
}

export async function saveGrant(grantId: string, accessToken: string): Promise<{ saved: boolean }> {
  return convexMutation(api.savedGrants.save, { grantId }, accessToken);
}

export async function unsaveGrant(grantId: string, accessToken: string): Promise<{ saved: boolean }> {
  return convexMutation(api.savedGrants.unsave, { grantId }, accessToken);
}

export async function isGrantSaved(grantId: string, accessToken: string): Promise<boolean> {
  return convexQuery(api.savedGrants.isSaved, { grantId }, accessToken);
}
