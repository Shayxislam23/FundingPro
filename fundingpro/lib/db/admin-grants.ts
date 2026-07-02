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

function toDeadlineMs(deadline: string | number | null | undefined): number | undefined {
  if (deadline == null || deadline === "") return undefined;
  const ms = new Date(deadline).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export async function createGrant(
  input: {
    title: string;
    titleRu?: string;
    description?: string;
    descriptionRu?: string;
    donorId: string;
    sectors?: string[];
    countryScope?: string[];
    applicantTypes?: string[];
    amountMin?: number | null;
    amountMax?: number | null;
    currency?: string;
    deadline?: string | number | null;
    sourceUrl?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  },
  accessToken: string
) {
  return convexMutation(
    api.adminGrants.create,
    {
      title: input.title,
      titleRu: input.titleRu,
      donorId: input.donorId,
      description: input.description,
      descriptionRu: input.descriptionRu,
      sectors: input.sectors,
      countryScope: input.countryScope,
      applicantTypes: input.applicantTypes,
      amountMin: input.amountMin ?? undefined,
      amountMax: input.amountMax ?? undefined,
      currency: input.currency,
      deadline: toDeadlineMs(input.deadline),
      sourceUrl: input.sourceUrl,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
    },
    accessToken
  );
}

export type ImportGrantInput = {
  title: string;
  donorName: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  sectors?: string[];
  countryScope?: string[];
  applicantTypes?: string[];
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  deadline?: string | number | null;
  sourceUrl?: string;
};

export async function bulkImportGrants(grants: ImportGrantInput[], accessToken: string) {
  return convexMutation(
    api.adminGrants.bulkImport,
    {
      grants: grants.map((g) => ({
        title: g.title,
        donorName: g.donorName,
        titleRu: g.titleRu,
        description: g.description,
        descriptionRu: g.descriptionRu,
        sectors: g.sectors,
        countryScope: g.countryScope,
        applicantTypes: g.applicantTypes,
        amountMin: g.amountMin,
        amountMax: g.amountMax,
        currency: g.currency,
        deadline: toDeadlineMs(g.deadline),
        sourceUrl: g.sourceUrl,
      })),
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
