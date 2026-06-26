import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function listAdminGrants(
  params: {
    search?: string;
    page: number;
    limit: number;
  },
  accessToken: string
) {
  return convexQuery(api.adminGrants.list, params, accessToken);
}

export async function createGrant(
  input: {
    title: string;
    titleRu?: string;
    description?: string;
    donorId: string;
    sectors?: string[];
    countryScope?: string[];
    amountMin?: number | null;
    amountMax?: number | null;
    deadline?: string | number | null;
    sourceUrl?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  },
  accessToken: string
) {
  const deadlineMs =
    input.deadline != null && input.deadline !== ""
      ? new Date(input.deadline).getTime()
      : undefined;
  return convexMutation(
    api.adminGrants.create,
    {
      title: input.title,
      donorId: input.donorId,
      description: input.description,
      sectors: input.sectors,
      countryScope: input.countryScope,
      amountMin: input.amountMin ?? undefined,
      amountMax: input.amountMax ?? undefined,
      deadline: deadlineMs,
    },
    accessToken
  );
}

export async function updateGrant(
  id: string,
  input: Partial<{
    title: string;
    titleRu: string;
    description: string;
    donorId: string;
    isActive: boolean;
    isFeatured: boolean;
    status: string;
  }>,
  accessToken: string
) {
  return convexMutation(api.adminGrants.update, { id, ...input }, accessToken);
}

export async function listDonors(accessToken: string) {
  return convexQuery(api.adminGrants.listDonors, {}, accessToken);
}

export async function createDonor(
  input: {
    name: string;
    nameRu?: string;
    shortName?: string;
    country?: string;
    website?: string;
  },
  accessToken: string
) {
  return convexMutation(api.adminGrants.createDonor, input, accessToken);
}

export async function listGrantRequirements(grantId: string, accessToken: string) {
  return convexQuery(api.adminGrants.listRequirements, { grantId }, accessToken);
}

export async function addGrantRequirement(
  grantId: string,
  input: { text: string; requirementType?: string; required?: boolean },
  accessToken: string
) {
  return convexMutation(api.adminGrants.addRequirement, { grantId, ...input }, accessToken);
}
