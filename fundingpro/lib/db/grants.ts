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
  return convexPublicQuery(api.grants.list, params);
}

export async function getGrantById(id: string): Promise<GrantDetail | null> {
  return convexPublicQuery(api.grants.getById, { id });
}

export async function grantsHealthCheck() {
  await convexPublicQuery(api.grants.healthCheck, {});
}
