export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PartnerApiError } from "@/lib/partner-api/errors";
import { convexInternalMutation, internal, withPartner } from "@/lib/partner-api/server";
import { describeIssues, eventsBodySchema, normalizeEvents } from "@/lib/partner-api/validation";
import { partnerPreflight, readJsonBody } from "@/lib/partner-api/with-partner";
import type { Id } from "@/convex/_generated/dataModel";

/** POST /v1/events — one event, or `{ "events": [...] }` with up to 50. */
export const POST = withPartner("POST /v1/events", async (req, { partner }) => {
  const parsed = eventsBodySchema.safeParse(await readJsonBody(req, 32_768));
  if (!parsed.success) throw new PartnerApiError("INVALID_REQUEST", describeIssues(parsed.error));

  const result = await convexInternalMutation(internal.partnerApi.recordEvents, {
    partnerId: partner.id as Id<"apiPartners">,
    events: normalizeEvents(parsed.data).map((e) => ({
      eventType: e.event_type,
      grantId: e.grant_id,
      externalUserId: e.external_user_id,
      sessionId: e.session_id,
      utmSource: e.utm_source,
      utmMedium: e.utm_medium,
      utmCampaign: e.utm_campaign,
    })),
  });

  return NextResponse.json(
    { success: true, accepted: result.accepted, rejected: result.rejected },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
});

export const OPTIONS = partnerPreflight;
