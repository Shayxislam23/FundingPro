import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export type OrganizationRow = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  isVerified: boolean;
  memberCount: number;
  readinessScore: number;
  createdAt: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  role: string;
  isVerified: boolean;
};

export async function getUserOrganizationDetails(
  accessToken: string
): Promise<UserOrganization | null> {
  return convexQuery(api.organizations.getForUser, {}, accessToken);
}

export async function createOrganizationForUser(
  input: {
    name: string;
    type: string;
    country?: string;
    sector?: string;
    description?: string;
  },
  accessToken: string
) {
  return convexMutation(api.organizations.createForUser, input, accessToken);
}

export async function updateOrganizationForUser(
  input: Partial<{ name: string; type: string; country: string; sector: string; description: string }>,
  accessToken: string
) {
  return convexMutation(api.organizations.updateForUser, input, accessToken);
}

export async function setOrganizationVerified(
  orgId: string,
  verified: boolean,
  accessToken: string
) {
  return convexMutation(api.organizations.setVerified, { orgId, verified }, accessToken);
}

export async function listOrganizations(limit: number | undefined, accessToken: string) {
  return convexQuery(api.organizations.listAll, { limit }, accessToken);
}
