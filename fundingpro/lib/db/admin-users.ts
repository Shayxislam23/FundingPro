import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function listAdminUsers(
  opts: {
    page: number;
    limit: number;
    search?: string;
  },
  accessToken: string
) {
  return convexQuery(api.users.listAdmin, opts, accessToken);
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
  accessToken: string
) {
  return convexMutation(api.users.setUserActive, { userId, isActive }, accessToken);
}

export async function listLabParticipantJourney(
  opts: { limit: number },
  accessToken: string
) {
  return convexQuery(api.onboarding.listJourneyForAdmin, opts, accessToken);
}

export async function listAiRequests(
  opts: { page: number; limit: number },
  accessToken: string
) {
  return convexQuery(api.proposals.listAiLogs, opts, accessToken);
}

export async function listAuditLogs(
  opts: { page: number; limit: number },
  accessToken: string
) {
  return convexQuery(api.audit.list, opts, accessToken);
}
