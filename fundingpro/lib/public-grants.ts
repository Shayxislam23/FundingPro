import {
  listGrants,
  getGrantById,
  type GrantDetail,
  type GrantListItem,
  type ListGrantsResult,
} from "@/lib/db/grants";

export type { GrantListItem, GrantDetail, ListGrantsResult };

export type PublicGrantsListParams = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  page?: number;
  limit?: number;
};

export type PublicGrantsListResult = ListGrantsResult;

export async function listPublicGrants(
  params: PublicGrantsListParams = {}
): Promise<PublicGrantsListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(params.limit ?? 20, 100);

  return listGrants({
    search: params.search,
    sector: params.sector,
    country: params.country,
    donorId: params.donorId,
    deadlineBefore: params.deadlineBefore,
    page,
    limit,
  });
}

export async function getPublicGrantById(id: string): Promise<GrantDetail | null> {
  return getGrantById(id);
}
