export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import { displayPrefix, generatePartnerApiKey, hashPartnerApiKey } from "@/convex/lib/partnerKeys";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Admin console for the Partner API (FundingPro staff only; Convex re-checks admin role).
 *
 * GET  ?view=partners | leads | commissions | report  (&partnerId, &status, &includeTest, &period=YYYY-MM)
 * POST { action, ... } — see `actionSchema`.
 */
export const GET = withAdmin(async (req, admin) => {
  const sp = new URL(req.url).searchParams;
  const view = sp.get("view") ?? "partners";
  const partnerId = (sp.get("partnerId") || undefined) as Id<"apiPartners"> | undefined;
  try {
    switch (view) {
      case "partners":
        return apiSuccess({ partners: await convexQuery(api.partnerAdmin.listPartners, {}, admin.accessToken) });
      case "leads": {
        const status = sp.get("status") || undefined;
        const leads = await convexQuery(
          api.partnerAdmin.listLeads,
          {
            partnerId,
            status: status as never,
            includeTest: sp.get("includeTest") === "true",
            limit: 300,
          },
          admin.accessToken
        );
        return apiSuccess({ leads });
      }
      case "commissions":
        return apiSuccess({
          commissions: await convexQuery(api.partnerAdmin.listCommissions, { partnerId }, admin.accessToken),
        });
      case "report": {
        if (!partnerId) return apiError("partnerId is required", 400, "INVALID_REQUEST");
        const now = new Date();
        const period =
          sp.get("period") ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
        return apiSuccess({
          report: await convexQuery(api.partnerAdmin.partnerReport, { partnerId, period }, admin.accessToken),
        });
      }
      default:
        return apiError("Unknown view", 400, "INVALID_REQUEST");
    }
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Request failed", 400, "PARTNER_ADMIN_ERROR");
  }
});

const list = z.array(z.string().trim().max(200)).max(20);

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_partner"),
    partnerCode: z.string().trim().min(3).max(63),
    name: z.string().trim().min(2).max(120),
    environment: z.enum(["production", "sandbox"]),
    allowedDomains: list.optional(),
    allowedIps: list.optional(),
    allowedAppIds: list.optional(),
    monthlyRequestLimit: z.number().int().positive().max(10_000_000).optional(),
    requestsPerMinute: z.number().int().positive().max(10_000).optional(),
    pilotDays: z.number().int().min(0).max(3650).optional(),
    plan: z.string().max(40).optional(),
    commissionPercentage: z.number().min(0).max(100).optional(),
    contactEmail: z.string().max(254).optional(),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("update_partner"),
    partnerId: z.string().min(1),
    status: z.enum(["active", "suspended", "terminated"]).optional(),
    allowedDomains: list.optional(),
    allowedIps: list.optional(),
    allowedAppIds: list.optional(),
    monthlyRequestLimit: z.number().int().positive().max(10_000_000).optional(),
    requestsPerMinute: z.number().int().positive().max(10_000).optional(),
    pilotEndsAt: z.number().nullable().optional(),
    plan: z.string().max(40).optional(),
    brandingRequired: z.boolean().optional(),
    commissionPercentage: z.number().min(0).max(100).optional(),
    commissionRule: z.enum(["first_paid_order", "every_paid_order", "none"]).optional(),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("issue_key"),
    partnerId: z.string().min(1),
    environment: z.enum(["production", "sandbox"]),
    expiresInDays: z.number().int().min(1).max(3650).optional(),
  }),
  z.object({ action: z.literal("revoke_key"), keyId: z.string().min(1), reason: z.string().max(500).optional() }),
  z.object({
    action: z.literal("update_lead"),
    leadId: z.string().min(1),
    status: z.enum(["new", "contacted", "qualified", "proposal_sent", "rejected", "closed", "duplicate"]).optional(),
    note: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("record_payment"),
    leadId: z.string().min(1),
    amount: z.number().positive().max(1e13),
    currency: z.string().trim().length(3),
  }),
  z.object({
    action: z.literal("update_commission"),
    commissionId: z.string().min(1),
    status: z.enum(["pending", "approved", "paid", "cancelled"]),
  }),
  z.object({
    action: z.literal("anonymize_leads"),
    phone: z.string().max(32).optional(),
    email: z.string().max(254).optional(),
  }),
  z.object({
    action: z.literal("set_grant_partner_fields"),
    grantId: z.string().min(1),
    partnerVisible: z.boolean().optional(),
    markVerifiedNow: z.boolean().optional(),
    verificationStatus: z.enum(["verified", "unverified", "invalid"]).optional(),
    titleUz: z.string().max(300).optional(),
    summary: z.string().max(500).optional(),
    summaryRu: z.string().max(500).optional(),
    summaryUz: z.string().max(500).optional(),
    eligibleRegions: list.optional(),
    tags: list.optional(),
    fundingType: z.string().max(40).optional(),
    cofinancingRequired: z.boolean().optional(),
    cofinancingPercentage: z.number().min(0).max(100).nullable().optional(),
    applicationLanguages: list.optional(),
    consultationAvailable: z.boolean().optional(),
  }),
]);

function stripLeadPrefix(id: string): string {
  return id.startsWith("lead_") ? id.slice(5) : id;
}

export const POST = withAdmin(async (req, admin) => {
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 400, "INVALID_REQUEST");
  }
  const body = parsed.data;
  const token = admin.accessToken;
  const audit = (action: string, entityId: string, metadata: Record<string, unknown> = {}) =>
    writeAuditLog({ userId: admin.userId, action, entityType: "api_partner", entityId, metadata });

  try {
    switch (body.action) {
      case "create_partner": {
        const { action: _a, ...args } = body;
        const result = await convexMutation(api.partnerAdmin.createPartner, args, token);
        await audit("partner_create", result.id, { partnerCode: body.partnerCode, environment: body.environment });
        return apiSuccess(result, 201);
      }
      case "update_partner": {
        const { action: _a, partnerId, ...patch } = body;
        await convexMutation(
          api.partnerAdmin.updatePartner,
          { partnerId: partnerId as Id<"apiPartners">, ...patch },
          token
        );
        await audit("partner_update", partnerId, { fields: Object.keys(patch).join(","), status: patch.status ?? "" });
        return apiSuccess({ updated: true });
      }
      case "issue_key": {
        const apiKey = generatePartnerApiKey(body.environment);
        const expiresAt = body.expiresInDays ? Date.now() + body.expiresInDays * 86_400_000 : undefined;
        const result = await convexMutation(
          api.partnerAdmin.registerKey,
          {
            partnerId: body.partnerId as Id<"apiPartners">,
            keyHash: await hashPartnerApiKey(apiKey),
            keyPrefix: displayPrefix(apiKey),
            environment: body.environment,
            expiresAt,
          },
          token
        );
        await audit("partner_key_issue", body.partnerId, { keyId: result.id, prefix: displayPrefix(apiKey) });
        // The plaintext key is returned exactly once and never stored.
        return NextResponse.json(
          { success: true, data: { keyId: result.id, apiKey, note: "Shown once. Store it securely." } },
          { status: 201, headers: { "Cache-Control": "no-store" } }
        );
      }
      case "revoke_key":
        await convexMutation(
          api.partnerAdmin.revokeKey,
          { keyId: body.keyId as Id<"apiPartnerKeys">, reason: body.reason },
          token
        );
        await audit("partner_key_revoke", body.keyId, { reason: body.reason ?? "" });
        return apiSuccess({ revoked: true });
      case "update_lead":
        await convexMutation(
          api.partnerAdmin.updateLead,
          { leadId: stripLeadPrefix(body.leadId) as Id<"partnerLeads">, status: body.status, note: body.note },
          token
        );
        await audit("partner_lead_update", body.leadId, { status: body.status ?? "" });
        return apiSuccess({ updated: true });
      case "record_payment": {
        const result = await convexMutation(
          api.partnerAdmin.recordLeadPayment,
          {
            leadId: stripLeadPrefix(body.leadId) as Id<"partnerLeads">,
            amount: body.amount,
            currency: body.currency,
          },
          token
        );
        await audit("partner_lead_payment", body.leadId, {
          amount: body.amount,
          currency: body.currency,
          commission: result.commissionAmount,
        });
        return apiSuccess(result);
      }
      case "update_commission":
        await convexMutation(
          api.partnerAdmin.updateCommissionStatus,
          { commissionId: body.commissionId as Id<"partnerCommissions">, status: body.status },
          token
        );
        await audit("partner_commission_update", body.commissionId, { status: body.status });
        return apiSuccess({ updated: true });
      case "anonymize_leads": {
        const result = await convexMutation(
          api.partnerAdmin.anonymizeLeadsByContact,
          { phone: body.phone, email: body.email },
          token
        );
        await audit("partner_leads_anonymize", "-", { count: result.anonymized });
        return apiSuccess(result);
      }
      case "set_grant_partner_fields": {
        const { action: _a, grantId, ...fields } = body;
        await convexMutation(
          api.partnerAdmin.setGrantPartnerFields,
          { grantId: grantId as Id<"grants">, ...fields },
          token
        );
        await audit("grant_partner_fields", grantId, {
          partnerVisible: fields.partnerVisible ?? "",
          verified: fields.markVerifiedNow ?? "",
        });
        return apiSuccess({ updated: true });
      }
    }
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Request failed", 400, "PARTNER_ADMIN_ERROR");
  }
});
