import { api, convexInternalQuery, convexPublicQuery, internal } from "@/lib/convex-server";

/**
 * With CONVEX_DEPLOY_KEY on the server, the catalog is read through internal queries,
 * so direct public Convex access can be disabled (PUBLIC_CATALOG_QUERIES_DISABLED=true).
 */
function hasServerCatalogAccess(): boolean {
  return Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());
}

type ListArgs = Parameters<typeof convexPublicQuery<typeof api.grants.list>>[1];

/**
 * Prefer the server-only query; fall back to the public one if the Convex deployment
 * is older than this web build (e.g. web deployed before `npx convex deploy`).
 */
async function withServerFallback<T>(serverCall: () => Promise<T>, publicCall: () => Promise<T>): Promise<T> {
  if (!hasServerCatalogAccess()) return publicCall();
  try {
    return await serverCall();
  } catch (err) {
    console.warn("[catalog] server query failed, falling back to public query", String(err).slice(0, 200));
    return publicCall();
  }
}

function queryList(args: ListArgs) {
  return withServerFallback(
    () => convexInternalQuery(internal.grants.listForServer, args),
    () => convexPublicQuery(api.grants.list, args)
  );
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
        applicantType: params.applicantType,
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
      applicantType: params.applicantType,
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
    return await withServerFallback(
      () => convexInternalQuery(internal.grants.getByIdForServer, { id }),
      () => convexPublicQuery(api.grants.getById, { id })
    );
  } catch (err) {
    const { isSeedFallbackEnabled, seedFallbackGrantDetail } = await import("./catalog-fallback");
    if (isSeedFallbackEnabled()) return seedFallbackGrantDetail(id);
    throw err;
  }
}

export async function grantsHealthCheck() {
  await convexPublicQuery(api.grants.healthCheck, {});
}
