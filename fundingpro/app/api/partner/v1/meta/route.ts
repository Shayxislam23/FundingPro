export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PARTNER_EVENT_TYPES, PUBLIC_APPLICANT_TYPES } from "@/convex/lib/partnerApi";
import { CACHE_META, PARTNER_API_VERSION } from "@/lib/partner-api/constants";
import { withPartner } from "@/lib/partner-api/server";
import { partnerPreflight } from "@/lib/partner-api/with-partner";

/** GET /v1/meta — vocabularies for filters and events. */
export const GET = withPartner("GET /v1/meta", async () =>
  NextResponse.json(
    {
      version: PARTNER_API_VERSION,
      applicant_types: PUBLIC_APPLICANT_TYPES,
      statuses: ["open", "upcoming"],
      sort: ["deadline_asc", "deadline_desc", "published_desc", "amount_desc"],
      event_types: PARTNER_EVENT_TYPES,
      max_page_size: 50,
      max_page_depth: 20,
      branding: {
        required_text: ["Grant data powered by FundingPro", "Grant opportunities provided by FundingPro"],
        card_requirements: ["official_url link", "last_verified_at date", "verify-with-official-source disclaimer"],
      },
    },
    { headers: { "Cache-Control": CACHE_META } }
  )
);

export const OPTIONS = partnerPreflight;
