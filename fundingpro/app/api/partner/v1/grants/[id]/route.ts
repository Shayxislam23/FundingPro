export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { CACHE_DETAIL } from "@/lib/partner-api/constants";
import { PartnerApiError } from "@/lib/partner-api/errors";
import { convexInternalQuery, internal, withPartner } from "@/lib/partner-api/server";
import { partnerPreflight } from "@/lib/partner-api/with-partner";
import type { Id } from "@/convex/_generated/dataModel";

/** GET /v1/grants/{grant_id} — one published grant (accepts `grant_<id>` or slug). */
export const GET = withPartner("GET /v1/grants/{id}", async (_req, { partner }, ctx) => {
  const params = await ctx.params;
  const raw = params.id;
  const grantId = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  if (!grantId || grantId.length > 100) throw new PartnerApiError("GRANT_NOT_FOUND", "Grant not found");

  const grant = await convexInternalQuery(internal.partnerApi.getGrant, {
    partnerId: partner.id as Id<"apiPartners">,
    grantId,
  });
  if (!grant) throw new PartnerApiError("GRANT_NOT_FOUND", "Grant not found");

  return NextResponse.json(
    { data: grant, attribution: "Grant data powered by FundingPro" },
    { headers: { "Cache-Control": CACHE_DETAIL } }
  );
});

export const OPTIONS = partnerPreflight;
