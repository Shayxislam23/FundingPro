import { api, convexInternalQuery, convexPublicQuery, internal } from "@/lib/convex-server";

/**
 * With CONVEX_DEPLOY_KEY on the server, the catalog is read through internal queries,
 * so direct public Convex access can be disabled (PUBLIC_CATALOG_QUERIES_DISABLED=true).
 */
function hasServerCatalogAccess(): boolean {
  return Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());
}

type ListArgs = Parameters<typeof convexPublicQuery<typeof api.grants.list>>[1];

function queryList(args: ListArgs) {
  return hasServerCatalogAccess()
    ? convexInternalQuery(internal.grants.listForServer, args)
    : convexPublicQuery(api.grants.list, args);
}
import type {
  GrantDetail,
  GrantListItem,
  ListGrantsParams,
  ListGrantsResult,
} from "./grants.types";

export type { GrantDetail, GrantListItem, ListGrantsParams, ListGrantsResult };
export type GrantListParams = ListGrantsParams;

export async function listGrants(params: ListGrantsParams): Promise<ListGrantsResult> {
  try {
    if (params.cursor) {
      const limit = params.limit ?? 20;
      const result = await queryList({
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

    return await queryList({
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
    return hasServerCatalogAccess()
      ? await convexInternalQuery(internal.grants.getByIdForServer, { id })
      : await convexPublicQuery(api.grants.getById, { id });
  } catch (err) {
    const { isSeedFallbackEnabled, seedFallbackGrantDetail } = await import("./catalog-fallback");
    if (isSeedFallbackEnabled()) return seedFallbackGrantDetail(id);
    throw err;
  }
}

export async function grantsHealthCheck() {
  await convexPublicQuery(api.grants.healthCheck, {});
}
