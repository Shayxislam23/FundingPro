import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function listSavedGrantIds(accessToken: string): Promise<string[]> {
  return convexQuery(api.savedOpportunities.listIds, {}, accessToken);
}

export async function saveGrant(opportunityId: string, accessToken: string): Promise<{ saved: boolean }> {
  return convexMutation(api.savedOpportunities.save, { opportunityId }, accessToken);
}

export async function unsaveGrant(opportunityId: string, accessToken: string): Promise<{ saved: boolean }> {
  return convexMutation(api.savedOpportunities.unsave, { opportunityId }, accessToken);
}

export async function isGrantSaved(opportunityId: string, accessToken: string): Promise<boolean> {
  return convexQuery(api.savedOpportunities.isSaved, { opportunityId }, accessToken);
}
