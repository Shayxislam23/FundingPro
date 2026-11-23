export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { CACHE_LIST } from "@/lib/partner-api/constants";
import { PartnerApiError } from "@/lib/partner-api/errors";
import { convexInternalQuery, internal, withPartner } from "@/lib/partner-api/server";
import {
  describeIssues,
  grantsListQuerySchema,
  searchParamsToObject,
  toFilters,
  toSort,
} from "@/lib/partner-api/validation";
import { partnerPreflight } from "@/lib/partner-api/with-partner";
import type { Id } from "@/convex/_generated/dataModel";

/** GET /v1/grants — published, current grant opportunities (max 50 per page, 20 pages). */
export const GET = withPartner("GET /v1/grants", async (req, { partner }) => {
  const raw = searchParamsToObject(new URL(req.url).searchParams);
  if ("__duplicate" in raw) throw new PartnerApiError("INVALID_REQUEST", `Duplicate query parameter: ${raw.__duplicate}`);
  const parsed = grantsListQuerySchema.safeParse(raw);
  if (!parsed.success) throw new PartnerApiError("INVALID_REQUEST", describeIssues(parsed.error));
  const q = parsed.data;
  const partnerId = partner.id as Id<"apiPartners">;

  const result = q.search
    ? await convexInternalQuery(internal.partnerApi.searchGrants, {
        partnerId,
        q: q.search,
        filters: toFilters(q),
        page: q.page,
        limit: q.limit,
      })
    : await convexInternalQuery(internal.partnerApi.listGrants, {
        partnerId,
        filters: toFilters(q),
        sort: toSort(q.sort),
        page: q.page,
        limit: q.limit,
      });

  return NextResponse.json(
    { data: result.data, pagination: result.pagination, attribution: "Grant data powered by FundingPro" },
    { headers: { "Cache-Control": CACHE_LIST } }
  );
});

export const OPTIONS = partnerPreflight;
