import { api, convexPublicQuery } from "@/lib/convex-server";
import type {
  GrantDetail,
  GrantListItem,
  ListGrantsParams,
  ListGrantsResult,
} from "./opportunities.types";

export type { GrantDetail, GrantListItem, ListGrantsParams, ListGrantsResult };
export type GrantListParams = ListGrantsParams;

export async function listGrants(params: ListGrantsParams): Promise<ListGrantsResult> {
  try {
    if (params.cursor) {
      const limit = params.limit ?? 20;
      const result = await convexPublicQuery(api.opportunities.list, {
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

    return await convexPublicQuery(api.opportunities.list, {
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
  } catch (err) {
    const { isSeedFallbackEnabled, seedFallbackGrantsList } = await import("./catalog-fallback");
    if (isSeedFallbackEnabled()) return seedFallbackGrantsList(params);
    throw err;
  }
}

export async function getGrantById(id: string): Promise<GrantDetail | null> {
  try {
    return await convexPublicQuery(api.opportunities.getById, { id });
  } catch (err) {
    const { isSeedFallbackEnabled, seedFallbackGrantDetail } = await import("./catalog-fallback");
    if (isSeedFallbackEnabled()) return seedFallbackGrantDetail(id);
    throw err;
  }
}

export async function grantsHealthCheck() {
  await convexPublicQuery(api.opportunities.healthCheck, {});
}
