import { api, convexPublicQuery } from "@/lib/convex-server";
import type {
  GrantDetail,
  GrantListItem,
  ListGrantsParams,
  ListGrantsResult,
} from "./grants.types";

export type { GrantDetail, GrantListItem, ListGrantsParams, ListGrantsResult };
export type GrantListParams = ListGrantsParams;

export async function listGrants(params: ListGrantsParams): Promise<ListGrantsResult> {
  if (params.cursor) {
    const limit = params.limit ?? 20;
    const result = await convexPublicQuery(api.grants.list, {
      search: params.search,
      sector: params.sector,
      country: params.country,
      donorId: params.donorId,
      deadlineBefore: params.deadlineBefore,
      deadlineAfter: params.deadlineAfter,
      activeOnly: params.activeOnly,
      featured: params.featured,
      today: params.today,
      paginationOpts: { numItems: limit, cursor: params.cursor },
    });
    return result;
  }

  return convexPublicQuery(api.grants.list, {
    search: params.search,
    sector: params.sector,
    country: params.country,
    donorId: params.donorId,
    deadlineBefore: params.deadlineBefore,
    deadlineAfter: params.deadlineAfter,
    activeOnly: params.activeOnly,
    featured: params.featured,
    today: params.today,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
}

export async function getGrantById(id: string): Promise<GrantDetail | null> {
  return convexPublicQuery(api.grants.getById, { id });
}

export async function grantsHealthCheck() {
  await convexPublicQuery(api.grants.healthCheck, {});
}
