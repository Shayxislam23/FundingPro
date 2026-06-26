import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function logAiRequest(
  params: {
    requestType: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    redactionApplied: boolean;
    status?: string;
  },
  accessToken: string
) {
  return convexMutation(api.proposals.logRequest, params, accessToken);
}

export async function saveProposalProject(
  params: {
    title: string;
    grantId?: string;
    donorFormat: string;
    sections: Record<string, string>;
  },
  accessToken: string
) {
  return convexMutation(api.proposals.saveProject, params, accessToken);
}

export async function listProposalProjects(accessToken: string, limit?: number) {
  return convexQuery(api.proposals.listProjects, { limit }, accessToken);
}
