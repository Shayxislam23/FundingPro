export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sha256Hex } from "@/convex/lib/partnerKeys";
import { PartnerApiError } from "@/lib/partner-api/errors";
import {
  convexInternalMutation,
  internal,
  notifyNewPartnerLead,
  withPartner,
} from "@/lib/partner-api/server";
import { describeIssues, idempotencyKeySchema, leadBodySchema } from "@/lib/partner-api/validation";
import { partnerPreflight, readJsonBody } from "@/lib/partner-api/with-partner";
import { after } from "next/server";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * POST /v1/leads — hand over a user who asked for application support.
 * Requires consent_to_contact=true. Supports `Idempotency-Key: <UUID>`.
 * Repeat submissions (same partner + grant + phone/email within 30 days) return the existing lead_id.
 */
export const POST = withPartner("POST /v1/leads", async (req, { partner }) => {
  const idemHeader = req.headers.get("idempotency-key");
  let idempotencyKey: string | undefined;
  if (idemHeader !== null) {
    const parsedKey = idempotencyKeySchema.safeParse(idemHeader.trim());
    if (!parsedKey.success) throw new PartnerApiError("INVALID_REQUEST", "Idempotency-Key must be a UUID");
    idempotencyKey = parsedKey.data.toLowerCase();
  }

  const body = await readJsonBody(req);
  // Consent is checked before full validation so a missing consent never results in stored data.
  if (body && typeof body === "object" && (body as Record<string, unknown>).consent_to_contact !== true) {
    throw new PartnerApiError("CONSENT_REQUIRED", "consent_to_contact must be true; the lead was not created");
  }
  const parsed = leadBodySchema.safeParse(body);
  if (!parsed.success) throw new PartnerApiError("INVALID_REQUEST", describeIssues(parsed.error));
  const lead = parsed.data;

  if (lead.partner_id !== partner.partnerCode) {
    throw new PartnerApiError("INVALID_REQUEST", "partner_id does not match the API key", 403);
  }

  const requestHash = await sha256Hex(JSON.stringify(lead));
  const result = await convexInternalMutation(internal.partnerApi.submitLead, {
    partnerId: partner.id as Id<"apiPartners">,
    idempotencyKey,
    requestHash,
    lead: {
      grantId: lead.grant_id,
      fullName: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      organizationName: lead.organization_name,
      applicantType: lead.applicant_type,
      region: lead.region,
      preferredLanguage: lead.preferred_language,
      message: lead.message,
      consentToContact: lead.consent_to_contact,
      consentTextVersion: lead.consent_text_version,
      utmSource: lead.utm_source,
      utmMedium: lead.utm_medium,
      utmCampaign: lead.utm_campaign,
      externalUserId: lead.external_user_id,
    },
  });

  if (!result.ok) throw new PartnerApiError(result.code, result.message);

  if (!result.duplicate && !result.isTest) {
    const notify = () =>
      notifyNewPartnerLead({
        partnerCode: partner.partnerCode,
        leadId: result.leadId,
        grantTitle: result.grantTitle,
        fullName: lead.full_name,
        phone: lead.phone,
        email: lead.email,
      }).catch((err) => console.error("[partner-api] lead notification failed", { leadId: result.leadId, err: String(err) }));
    try {
      after(notify);
    } catch {
      void notify();
    }
  }

  return NextResponse.json(
    {
      success: true,
      lead_id: result.leadId,
      referral_id: result.referralId,
      status: "received",
      duplicate: result.duplicate,
      is_test: result.isTest,
      assigned_to: "FundingPro",
      created_at: new Date(result.createdAt).toISOString(),
    },
    { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } }
  );
});

export const OPTIONS = partnerPreflight;
