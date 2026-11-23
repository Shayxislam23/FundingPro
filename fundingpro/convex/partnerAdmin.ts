/**
 * Partner API — FundingPro admin functions (admin JWT required) and CLI-only
 * internal helpers. Commercial data (commissions, payments) is only reachable here,
 * never through the partner-facing API.
 */
import { v } from "convex/values";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  PARTNER_EVENT_TYPES,
  buildGrantSearchText,
  computeCommission,
  monthRange,
  normalizeEmail,
  normalizePhone,
  slugify,
  toPublicGrantId,
  toPublicLeadId,
  type PartnerEventType,
} from "./lib/partnerApi";
import { displayPrefix, generatePartnerApiKey, hashPartnerApiKey } from "./lib/partnerKeys";

const environmentValidator = v.union(v.literal("production"), v.literal("sandbox"));
const partnerStatusValidator = v.union(v.literal("active"), v.literal("suspended"), v.literal("terminated"));
const commissionRuleValidator = v.union(
  v.literal("first_paid_order"),
  v.literal("every_paid_order"),
  v.literal("none")
);
const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("proposal_sent"),
  v.literal("paid"),
  v.literal("rejected"),
  v.literal("closed"),
  v.literal("duplicate")
);

const PARTNER_CODE_RE = /^[a-z0-9][a-z0-9_]{2,62}$/;

function cleanList(values: string[] | undefined, max = 20): string[] {
  return [...new Set((values ?? []).map((s) => s.trim()).filter(Boolean))].slice(0, max);
}

function normalizeDomain(raw: string): string {
  // Store origins as scheme://host[:port] for exact CORS comparison.
  const value = raw.trim().toLowerCase().replace(/\/+$/, "");
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

// ---------------------------------------------------------------------------
// Partners & keys
// ---------------------------------------------------------------------------

function serializePartner(p: Doc<"apiPartners">) {
  return {
    id: p._id,
    partnerCode: p.partnerCode,
    name: p.name,
    status: p.status,
    environment: p.environment,
    allowedDomains: p.allowedDomains,
    allowedIps: p.allowedIps,
    allowedAppIds: p.allowedAppIds,
    monthlyRequestLimit: p.monthlyRequestLimit,
    requestsPerMinute: p.requestsPerMinute,
    pilotStartedAt: p.pilotStartedAt ?? null,
    pilotEndsAt: p.pilotEndsAt ?? null,
    plan: p.plan,
    brandingRequired: p.brandingRequired,
    commissionPercentage: p.commissionPercentage,
    commissionRule: p.commissionRule,
    referralBaseUrl: p.referralBaseUrl ?? null,
    contactEmail: p.contactEmail ?? null,
    notes: p.notes ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export const listPartners = adminQuery({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db.query("apiPartners").order("desc").take(200);
    const out = [];
    for (const p of partners) {
      const keys = await ctx.db
        .query("apiPartnerKeys")
        .withIndex("by_partnerId", (q) => q.eq("partnerId", p._id))
        .order("desc")
        .take(20);
      out.push({
        ...serializePartner(p),
        keys: keys.map((k) => ({
          id: k._id,
          keyPrefix: k.keyPrefix,
          environment: k.environment,
          status: k.status,
          expiresAt: k.expiresAt ?? null,
          lastUsedAt: k.lastUsedAt ?? null,
          revokedAt: k.revokedAt ?? null,
          createdAt: k.createdAt,
        })),
      });
    }
    return out;
  },
});

const partnerFields = {
  name: v.string(),
  environment: environmentValidator,
  allowedDomains: v.optional(v.array(v.string())),
  allowedIps: v.optional(v.array(v.string())),
  allowedAppIds: v.optional(v.array(v.string())),
  monthlyRequestLimit: v.optional(v.number()),
  requestsPerMinute: v.optional(v.number()),
  pilotDays: v.optional(v.number()),
  plan: v.optional(v.string()),
  brandingRequired: v.optional(v.boolean()),
  commissionPercentage: v.optional(v.number()),
  commissionRule: v.optional(commissionRuleValidator),
  referralBaseUrl: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  notes: v.optional(v.string()),
};

async function insertPartner(
  ctx: MutationCtx,
  args: { partnerCode: string } & {
    name: string;
    environment: "production" | "sandbox";
    allowedDomains?: string[];
    allowedIps?: string[];
    allowedAppIds?: string[];
    monthlyRequestLimit?: number;
    requestsPerMinute?: number;
    pilotDays?: number;
    plan?: string;
    brandingRequired?: boolean;
    commissionPercentage?: number;
    commissionRule?: "first_paid_order" | "every_paid_order" | "none";
    referralBaseUrl?: string;
    contactEmail?: string;
    notes?: string;
  }
): Promise<Id<"apiPartners">> {
  const code = args.partnerCode.trim().toLowerCase();
  if (!PARTNER_CODE_RE.test(code)) throw new Error("partnerCode must be 3-63 chars: a-z, 0-9, _");
  const existing = await ctx.db
    .query("apiPartners")
    .withIndex("by_partnerCode", (q) => q.eq("partnerCode", code))
    .first();
  if (existing) throw new Error(`Partner ${code} already exists`);
  const now = Date.now();
  // Pilot defaults from the agreement; editable later, never hard-coded in request logic.
  const pilotDays = args.pilotDays ?? 30;
  return await ctx.db.insert("apiPartners", {
    partnerCode: code,
    name: args.name.trim().slice(0, 120),
    status: "active",
    environment: args.environment,
    allowedDomains: cleanList(args.allowedDomains).map(normalizeDomain),
    allowedIps: cleanList(args.allowedIps),
    allowedAppIds: cleanList(args.allowedAppIds),
    monthlyRequestLimit: Math.max(1, Math.floor(args.monthlyRequestLimit ?? 5000)),
    requestsPerMinute: Math.max(1, Math.floor(args.requestsPerMinute ?? 60)),
    pilotStartedAt: pilotDays > 0 ? now : undefined,
    pilotEndsAt: pilotDays > 0 ? now + pilotDays * 24 * 60 * 60 * 1000 : undefined,
    plan: args.plan ?? "pilot",
    brandingRequired: args.brandingRequired ?? true,
    commissionPercentage: Math.min(100, Math.max(0, args.commissionPercentage ?? 10)),
    commissionRule: args.commissionRule ?? "first_paid_order",
    referralBaseUrl: args.referralBaseUrl,
    contactEmail: args.contactEmail ? normalizeEmail(args.contactEmail) ?? undefined : undefined,
    notes: args.notes?.slice(0, 2000),
    createdAt: now,
    updatedAt: now,
  });
}

export const createPartner = adminMutation({
  args: { partnerCode: v.string(), ...partnerFields },
  handler: async (ctx, args) => {
    const id = await insertPartner(ctx, args);
    return { id };
  },
});

export const updatePartner = adminMutation({
  args: {
    partnerId: v.id("apiPartners"),
    name: v.optional(v.string()),
    status: v.optional(partnerStatusValidator),
    allowedDomains: v.optional(v.array(v.string())),
    allowedIps: v.optional(v.array(v.string())),
    allowedAppIds: v.optional(v.array(v.string())),
    monthlyRequestLimit: v.optional(v.number()),
    requestsPerMinute: v.optional(v.number()),
    pilotEndsAt: v.optional(v.union(v.number(), v.null())),
    plan: v.optional(v.string()),
    brandingRequired: v.optional(v.boolean()),
    commissionPercentage: v.optional(v.number()),
    commissionRule: v.optional(commissionRuleValidator),
    referralBaseUrl: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const partner = await ctx.db.get("apiPartners", args.partnerId);
    if (!partner) throw new Error("Partner not found");
    const patch: Partial<Doc<"apiPartners">> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim().slice(0, 120);
    if (args.status !== undefined) patch.status = args.status;
    if (args.allowedDomains !== undefined) patch.allowedDomains = cleanList(args.allowedDomains).map(normalizeDomain);
    if (args.allowedIps !== undefined) patch.allowedIps = cleanList(args.allowedIps);
    if (args.allowedAppIds !== undefined) patch.allowedAppIds = cleanList(args.allowedAppIds);
    if (args.monthlyRequestLimit !== undefined) patch.monthlyRequestLimit = Math.max(1, Math.floor(args.monthlyRequestLimit));
    if (args.requestsPerMinute !== undefined) patch.requestsPerMinute = Math.max(1, Math.floor(args.requestsPerMinute));
    if (args.pilotEndsAt !== undefined) patch.pilotEndsAt = args.pilotEndsAt ?? undefined;
    if (args.plan !== undefined) patch.plan = args.plan;
    if (args.brandingRequired !== undefined) patch.brandingRequired = args.brandingRequired;
    if (args.commissionPercentage !== undefined) {
      patch.commissionPercentage = Math.min(100, Math.max(0, args.commissionPercentage));
    }
    if (args.commissionRule !== undefined) patch.commissionRule = args.commissionRule;
    if (args.referralBaseUrl !== undefined) patch.referralBaseUrl = args.referralBaseUrl;
    if (args.contactEmail !== undefined) patch.contactEmail = normalizeEmail(args.contactEmail) ?? undefined;
    if (args.notes !== undefined) patch.notes = args.notes.slice(0, 2000);
    await ctx.db.patch("apiPartners", partner._id, patch);
    return null;
  },
});

/** Stores a key generated by the Next.js admin route. Plaintext never reaches the DB. */
export const registerKey = adminMutation({
  args: {
    partnerId: v.id("apiPartners"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    environment: environmentValidator,
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get("apiPartners", args.partnerId);
    if (!partner) throw new Error("Partner not found");
    if (partner.environment !== args.environment) throw new Error("Key environment must match partner environment");
    if (!/^[0-9a-f]{64}$/.test(args.keyHash)) throw new Error("Invalid key hash");
    const now = Date.now();
    const id = await ctx.db.insert("apiPartnerKeys", {
      partnerId: partner._id,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix.slice(0, 12),
      environment: args.environment,
      status: "active",
      expiresAt: args.expiresAt ?? partner.pilotEndsAt,
      createdByUserId: ctx.user._id,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const revokeKey = adminMutation({
  args: { keyId: v.id("apiPartnerKeys"), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = await ctx.db.get("apiPartnerKeys", args.keyId);
    if (!key) throw new Error("Key not found");
    const now = Date.now();
    await ctx.db.patch("apiPartnerKeys", key._id, {
      status: "revoked",
      revokedAt: now,
      revokedReason: args.reason?.slice(0, 500),
      updatedAt: now,
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Leads (FundingPro CRM view)
// ---------------------------------------------------------------------------

function serializeLead(lead: Doc<"partnerLeads">, partnerCode: string, grantTitle: string | null) {
  return {
    id: toPublicLeadId(lead._id),
    rawId: lead._id,
    partnerCode,
    grantId: toPublicGrantId(lead.grantId),
    grantTitle,
    referralId: lead.referralId,
    fullName: lead.fullName,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    organizationName: lead.organizationName ?? null,
    applicantType: lead.applicantType ?? null,
    region: lead.region ?? null,
    preferredLanguage: lead.preferredLanguage ?? null,
    message: lead.message ?? null,
    consentTextVersion: lead.consentTextVersion,
    utmSource: lead.utmSource ?? null,
    utmMedium: lead.utmMedium ?? null,
    utmCampaign: lead.utmCampaign ?? null,
    status: lead.status,
    contactCount: lead.contactCount,
    firstContactAt: lead.firstContactAt,
    lastContactAt: lead.lastContactAt,
    paymentReceived: lead.paymentReceived,
    paymentAmount: lead.paymentAmount ?? null,
    paymentCurrency: lead.paymentCurrency ?? null,
    isTest: lead.isTest,
    anonymized: Boolean(lead.anonymizedAt),
  };
}

export const listLeads = adminQuery({
  args: {
    partnerId: v.optional(v.id("apiPartners")),
    status: v.optional(leadStatusValidator),
    includeTest: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 100), 500);
    const base = args.partnerId
      ? ctx.db
          .query("partnerLeads")
          .withIndex("by_partnerId_and_createdAt", (q) => q.eq("partnerId", args.partnerId!))
          .order("desc")
      : ctx.db.query("partnerLeads").withIndex("by_createdAt").order("desc");

    const partnerCodes = new Map<string, string>();
    const grantTitles = new Map<string, string | null>();
    const out = [];
    for await (const lead of base) {
      if (!args.includeTest && lead.isTest) continue;
      if (args.status && lead.status !== args.status) continue;
      if (!partnerCodes.has(lead.partnerId)) {
        partnerCodes.set(lead.partnerId, (await ctx.db.get("apiPartners", lead.partnerId))?.partnerCode ?? "?");
      }
      if (!grantTitles.has(lead.grantId)) {
        grantTitles.set(lead.grantId, (await ctx.db.get("grants", lead.grantId))?.title ?? null);
      }
      out.push(serializeLead(lead, partnerCodes.get(lead.partnerId)!, grantTitles.get(lead.grantId) ?? null));
      if (out.length >= limit) break;
    }
    return out;
  },
});

export const updateLead = adminMutation({
  args: {
    leadId: v.id("partnerLeads"),
    status: v.optional(leadStatusValidator),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lead = await ctx.db.get("partnerLeads", args.leadId);
    if (!lead) throw new Error("Lead not found");
    const now = Date.now();
    if (args.status && args.status !== lead.status) {
      if (args.status === "paid" && !lead.paymentReceived) {
        throw new Error("Use recordLeadPayment to mark a lead as paid");
      }
      await ctx.db.patch("partnerLeads", lead._id, { status: args.status, updatedAt: now });
      await ctx.db.insert("partnerLeadEvents", {
        leadId: lead._id,
        type: "status_change",
        fromStatus: lead.status,
        toStatus: args.status,
        actorUserId: ctx.user._id,
        createdAt: now,
      });
    }
    if (args.note?.trim()) {
      await ctx.db.insert("partnerLeadEvents", {
        leadId: lead._id,
        type: "note",
        note: args.note.trim().slice(0, 2000),
        actorUserId: ctx.user._id,
        createdAt: now,
      });
    }
    return null;
  },
});

/**
 * Records money actually received from the client. Only then is a partner
 * commission created (per the partner's commissionRule).
 */
export async function applyLeadPayment(
  ctx: MutationCtx,
  args: { leadId: Id<"partnerLeads">; amount: number; currency: string; actorUserId?: Id<"users"> }
) {
  const lead = await ctx.db.get("partnerLeads", args.leadId);
  if (!lead) throw new Error("Lead not found");
  if (!(args.amount > 0)) throw new Error("amount must be positive");
  const partner = await ctx.db.get("apiPartners", lead.partnerId);
  if (!partner) throw new Error("Partner not found");
  const now = Date.now();
  const currency = args.currency.trim().toUpperCase().slice(0, 3);

  const previousCommissions = await ctx.db
    .query("partnerCommissions")
    .withIndex("by_leadId", (q) => q.eq("leadId", lead._id))
    .take(1);

  await ctx.db.patch("partnerLeads", lead._id, {
    status: "paid",
    paymentReceived: true,
    paymentAmount: (lead.paymentAmount ?? 0) + args.amount,
    paymentCurrency: currency,
    paidAt: lead.paidAt ?? now,
    updatedAt: now,
  });
  await ctx.db.insert("partnerLeadEvents", {
    leadId: lead._id,
    type: "payment_recorded",
    fromStatus: lead.status,
    toStatus: "paid",
    note: `${args.amount} ${currency}`,
    actorUserId: args.actorUserId,
    createdAt: now,
  });

  const eligible =
    !lead.isTest &&
    partner.commissionRule !== "none" &&
    (partner.commissionRule === "every_paid_order" || previousCommissions.length === 0);
  if (!eligible) return { commissionId: null, commissionAmount: 0 };

  const commissionAmount = computeCommission(args.amount, partner.commissionPercentage);
  const commissionId = await ctx.db.insert("partnerCommissions", {
    partnerId: partner._id,
    leadId: lead._id,
    clientPaymentAmount: args.amount,
    currency,
    commissionPercentage: partner.commissionPercentage,
    commissionAmount,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return { commissionId, commissionAmount };
}

export const recordLeadPayment = adminMutation({
  args: { leadId: v.id("partnerLeads"), amount: v.number(), currency: v.string() },
  handler: async (ctx, args) => {
    return await applyLeadPayment(ctx, { ...args, actorUserId: ctx.user._id });
  },
});

export const listCommissions = adminQuery({
  args: { partnerId: v.optional(v.id("apiPartners")) },
  handler: async (ctx, args) => {
    const rows = args.partnerId
      ? await ctx.db
          .query("partnerCommissions")
          .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId!))
          .order("desc")
          .take(500)
      : await ctx.db.query("partnerCommissions").order("desc").take(500);
    return rows.map((c) => ({
      id: c._id,
      partnerId: c.partnerId,
      leadId: toPublicLeadId(c.leadId),
      clientPaymentAmount: c.clientPaymentAmount,
      currency: c.currency,
      commissionPercentage: c.commissionPercentage,
      commissionAmount: c.commissionAmount,
      status: c.status,
      paidAt: c.paidAt ?? null,
      createdAt: c.createdAt,
    }));
  },
});

export const updateCommissionStatus = adminMutation({
  args: {
    commissionId: v.id("partnerCommissions"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("paid"), v.literal("cancelled")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch("partnerCommissions", args.commissionId, {
      status: args.status,
      paidAt: args.status === "paid" ? now : undefined,
      updatedAt: now,
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const REPORT_SCAN_CAP = 15000;

export async function buildPartnerReport(ctx: QueryCtx, partnerId: Id<"apiPartners">, period: string) {
  const range = monthRange(period);
  if (!range) throw new Error("period must be YYYY-MM");
  const partner = await ctx.db.get("apiPartners", partnerId);
  if (!partner) throw new Error("Partner not found");

  const usage = await ctx.db
    .query("partnerMonthlyUsage")
    .withIndex("by_partnerId_and_yearMonth", (q) => q.eq("partnerId", partnerId).eq("yearMonth", period))
    .unique();

  const counts = Object.fromEntries(PARTNER_EVENT_TYPES.map((t) => [t, 0])) as Record<PartnerEventType, number>;
  const uniqueViews = new Set<string>();
  const viewsByGrant = new Map<string, number>();
  let scanned = 0;
  let truncated = false;
  for await (const e of ctx.db
    .query("partnerEvents")
    .withIndex("by_partnerId_and_createdAt", (q) =>
      q.eq("partnerId", partnerId).gte("createdAt", range.start).lt("createdAt", range.end)
    )) {
    if (++scanned > REPORT_SCAN_CAP) {
      truncated = true;
      break;
    }
    counts[e.eventType] += 1;
    if (e.eventType === "grant_view" && e.grantId) {
      uniqueViews.add(`${e.grantId}:${e.externalUserId ?? e.sessionId ?? e._id}`);
      viewsByGrant.set(e.grantId, (viewsByGrant.get(e.grantId) ?? 0) + 1);
    }
  }

  let leadsSubmitted = 0;
  let qualified = 0;
  let paid = 0;
  for await (const lead of ctx.db
    .query("partnerLeads")
    .withIndex("by_partnerId_and_createdAt", (q) =>
      q.eq("partnerId", partnerId).gte("createdAt", range.start).lt("createdAt", range.end)
    )) {
    leadsSubmitted += 1;
    if (["qualified", "proposal_sent", "paid"].includes(lead.status)) qualified += 1;
    if (lead.paymentReceived) paid += 1;
  }

  const topGrants = [];
  for (const [grantId, views] of [...viewsByGrant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    const grant = await ctx.db.get("grants", grantId as Id<"grants">);
    topGrants.push({ grant_id: toPublicGrantId(grantId), title: grant?.title ?? null, views });
  }

  return {
    partner_id: partner.partnerCode,
    period,
    api_requests: usage?.requestCount ?? 0,
    grant_views: counts.grant_view,
    unique_grant_views: uniqueViews.size,
    grant_clicks: counts.grant_click,
    official_source_clicks: counts.official_source_click,
    consultation_clicks: counts.consultation_click,
    leads_started: counts.lead_started,
    leads_submitted: leadsSubmitted,
    qualified_leads: qualified,
    paid_clients: paid,
    top_grants: topGrants,
    truncated,
  };
}

export const partnerReport = adminQuery({
  args: { partnerId: v.id("apiPartners"), period: v.string() },
  handler: async (ctx, args) => buildPartnerReport(ctx, args.partnerId, args.period),
});

// ---------------------------------------------------------------------------
// Personal data: erasure / anonymization on user request
// ---------------------------------------------------------------------------

export async function anonymizeLeads(
  ctx: MutationCtx,
  args: { phone?: string; email?: string; actorUserId?: Id<"users"> }
): Promise<number> {
  const phone = normalizePhone(args.phone);
  const email = normalizeEmail(args.email);
  if (!phone && !email) throw new Error("phone or email required");
  const now = Date.now();
  const targets = new Map<string, Doc<"partnerLeads">>();
  if (phone) {
    for (const l of await ctx.db.query("partnerLeads").withIndex("by_phone", (q) => q.eq("phone", phone)).take(200)) {
      targets.set(l._id, l);
    }
  }
  if (email) {
    for (const l of await ctx.db.query("partnerLeads").withIndex("by_email", (q) => q.eq("email", email)).take(200)) {
      targets.set(l._id, l);
    }
  }
  for (const lead of targets.values()) {
    await ctx.db.patch("partnerLeads", lead._id, {
      fullName: "[deleted]",
      phone: undefined,
      email: undefined,
      organizationName: undefined,
      message: undefined,
      externalUserId: undefined,
      anonymizedAt: now,
      updatedAt: now,
    });
    for (const ev of await ctx.db
      .query("partnerLeadEvents")
      .withIndex("by_leadId", (q) => q.eq("leadId", lead._id))
      .take(200)) {
      if (ev.note) await ctx.db.patch("partnerLeadEvents", ev._id, { note: undefined });
    }
    await ctx.db.insert("partnerLeadEvents", {
      leadId: lead._id,
      type: "anonymized",
      actorUserId: args.actorUserId,
      createdAt: now,
    });
  }
  return targets.size;
}

export const anonymizeLeadsByContact = adminMutation({
  args: { phone: v.optional(v.string()), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const count = await anonymizeLeads(ctx, { ...args, actorUserId: ctx.user._id });
    return { anonymized: count };
  },
});

// ---------------------------------------------------------------------------
// Grant publication for partners (editorial)
// ---------------------------------------------------------------------------

export const setGrantPartnerFields = adminMutation({
  args: {
    grantId: v.id("grants"),
    partnerVisible: v.optional(v.boolean()),
    markVerifiedNow: v.optional(v.boolean()),
    verificationStatus: v.optional(v.union(v.literal("verified"), v.literal("unverified"), v.literal("invalid"))),
    slug: v.optional(v.string()),
    titleUz: v.optional(v.string()),
    summary: v.optional(v.string()),
    summaryRu: v.optional(v.string()),
    summaryUz: v.optional(v.string()),
    descriptionUz: v.optional(v.string()),
    eligibleRegions: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    fundingType: v.optional(v.string()),
    cofinancingRequired: v.optional(v.boolean()),
    cofinancingPercentage: v.optional(v.union(v.number(), v.null())),
    applicationLanguages: v.optional(v.array(v.string())),
    consultationAvailable: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const grant = await ctx.db.get("grants", args.grantId);
    if (!grant) throw new Error("Grant not found");
    const now = Date.now();
    const { grantId, markVerifiedNow, cofinancingPercentage, slug, ...rest } = args;
    const patch: Partial<Doc<"grants">> = { ...rest, updatedAt: now, lastUpdatedAt: now };
    if (markVerifiedNow) {
      patch.lastVerifiedAt = now;
      patch.verificationStatus = args.verificationStatus ?? "verified";
    }
    if (cofinancingPercentage !== undefined) patch.cofinancingPercentage = cofinancingPercentage ?? undefined;
    if (slug !== undefined) patch.slug = slugify(slug) || grant.slug;
    if (args.partnerVisible === true) {
      if ((patch.verificationStatus ?? grant.verificationStatus) === "invalid") {
        throw new Error("Cannot publish a grant marked invalid");
      }
      if (!(patch.lastVerifiedAt ?? grant.lastVerifiedAt)) {
        throw new Error("Verify the grant source before publishing to partners");
      }
      if (!grant.sourceUrl) throw new Error("Grant needs an official source URL before publishing to partners");
      if (grant.publishedAt === undefined) patch.publishedAt = now;
      if (!grant.slug && !patch.slug) patch.slug = `${slugify(grant.title) || "grant"}-${grant._id.slice(-6)}`;
    }
    await ctx.db.patch("grants", grantId, patch);
    const updated = (await ctx.db.get("grants", grantId))!;
    const donor = await ctx.db.get("donors", updated.donorId);
    await ctx.db.patch("grants", grantId, { searchText: buildGrantSearchText(updated, donor) });
    return null;
  },
});

// ---------------------------------------------------------------------------
// CLI-only (internal): sandbox seed and production bootstrap
// ---------------------------------------------------------------------------

const SANDBOX_GRANTS = [
  {
    title: "[TEST] Green Innovation Grant 2027",
    titleRu: "[ТЕСТ] Грант зелёных инноваций 2027",
    titleUz: "[TEST] Yashil innovatsiyalar granti 2027",
    summary: "Test grant for climate-smart SMEs in Uzbekistan.",
    sectors: ["climate", "agriculture", "technology"],
    applicantTypes: ["Business", "NGO", "Startup"],
    regions: ["All Uzbekistan"],
    tags: ["green", "innovation", "SME"],
    amountMin: 10000,
    amountMax: 100000,
    days: 90,
    cofinancing: false,
  },
  {
    title: "[TEST] Jizzakh Agro Modernization Fund",
    titleRu: "[ТЕСТ] Фонд модернизации агросектора Джизака",
    titleUz: "[TEST] Jizzax agro modernizatsiya jamg‘armasi",
    summary: "Test grant for farms and agro-processing in Jizzakh region.",
    sectors: ["agriculture"],
    applicantTypes: ["Business"],
    regions: ["Jizzakh"],
    tags: ["agro", "Jizzakh"],
    amountMin: 5000,
    amountMax: 50000,
    days: 10,
    cofinancing: true,
  },
  {
    title: "[TEST] Women Entrepreneurs Support Programme",
    titleRu: "[ТЕСТ] Программа поддержки женщин-предпринимателей",
    titleUz: "[TEST] Tadbirkor ayollarni qo‘llab-quvvatlash dasturi",
    summary: "Test grant for women-led small businesses.",
    sectors: ["gender", "economy"],
    applicantTypes: ["Business", "Individual"],
    regions: ["All Uzbekistan"],
    tags: ["women", "SME"],
    amountMin: 2000,
    amountMax: 20000,
    days: 45,
    cofinancing: false,
  },
  {
    title: "[TEST] Civil Society Digital Grant",
    titleRu: "[ТЕСТ] Цифровой грант для ННО",
    titleUz: "[TEST] NNT uchun raqamli grant",
    summary: "Test grant for NGOs working on digital services.",
    sectors: ["technology", "civil_society"],
    applicantTypes: ["NGO"],
    regions: ["All Uzbekistan"],
    tags: ["digital", "NGO"],
    amountMin: 15000,
    amountMax: 60000,
    days: 120,
    cofinancing: false,
  },
];

function assertSandboxDeployment() {
  if (process.env.PARTNER_SANDBOX_DEPLOYMENT !== "true") {
    throw new Error("Refusing to seed: set PARTNER_SANDBOX_DEPLOYMENT=true on the SANDBOX Convex deployment only");
  }
}

/**
 * Seeds test grants + the sandbox partner and returns a fresh sandbox key (shown once).
 * Run on the sandbox deployment only:
 *   npx convex env set PARTNER_SANDBOX_DEPLOYMENT true
 *   npx convex run partnerAdmin:seedSandbox '{}'
 */
export const seedSandbox = internalMutation({
  args: { partnerCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertSandboxDeployment();
    const now = Date.now();
    const code = (args.partnerCode ?? "jizzakh_business_platform").toLowerCase();

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50)
      .then((rows) => rows.find((d) => d.name === "[TEST] Example Foundation") ?? null);
    if (!donor) {
      const donorId = await ctx.db.insert("donors", {
        name: "[TEST] Example Foundation",
        country: "Germany",
        type: "foundation",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      donor = (await ctx.db.get("donors", donorId))!;
    }

    let createdGrants = 0;
    for (const g of SANDBOX_GRANTS) {
      const slug = slugify(g.title);
      const exists = await ctx.db.query("grants").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (exists) continue;
      const doc = {
        title: g.title,
        titleRu: g.titleRu,
        titleUz: g.titleUz,
        summary: g.summary,
        description: `${g.summary} This record exists only in the sandbox.`,
        donorId: donor._id,
        sectors: g.sectors,
        countryScope: ["Uzbekistan"],
        applicantTypes: g.applicantTypes,
        eligibleRegions: g.regions,
        tags: g.tags,
        amountMin: g.amountMin,
        amountMax: g.amountMax,
        currency: "USD",
        fundingType: "grant",
        cofinancingRequired: g.cofinancing,
        cofinancingPercentage: g.cofinancing ? 20 : undefined,
        applicationLanguages: ["English"],
        deadline: now + g.days * 24 * 60 * 60 * 1000,
        sourceUrl: "https://example.org/official-grant-announcement",
        status: "open",
        isActive: true,
        isFeatured: false,
        partnerVisible: true,
        verificationStatus: "verified" as const,
        lastVerifiedAt: now,
        publishedAt: now,
        consultationAvailable: true,
        slug,
        lastUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const id = await ctx.db.insert("grants", doc);
      await ctx.db.patch("grants", id, { searchText: buildGrantSearchText(doc, donor) });
      createdGrants += 1;
    }

    let partner = await ctx.db
      .query("apiPartners")
      .withIndex("by_partnerCode", (q) => q.eq("partnerCode", code))
      .first();
    if (!partner) {
      const id = await insertPartner(ctx, {
        partnerCode: code,
        name: "Jizzakh Business Platform (sandbox)",
        environment: "sandbox",
        pilotDays: 0,
        monthlyRequestLimit: 5000,
        requestsPerMinute: 60,
        referralBaseUrl: "https://sandbox.fundingpro.uz",
      });
      partner = (await ctx.db.get("apiPartners", id))!;
    }

    const apiKey = generatePartnerApiKey("sandbox");
    await ctx.db.insert("apiPartnerKeys", {
      partnerId: partner._id,
      keyHash: await hashPartnerApiKey(apiKey),
      keyPrefix: displayPrefix(apiKey),
      environment: "sandbox",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return {
      partnerCode: partner.partnerCode,
      createdGrants,
      apiKey,
      note: "Store this sandbox key now — it is not shown again.",
    };
  },
});

/**
 * Production bootstrap from the CLI (alternative to the admin UI). Returns the key once.
 *   npx convex run --prod partnerAdmin:bootstrapPartner '{"partnerCode":"jizzakh_business_platform","name":"…","environment":"production","allowedDomains":["https://partner.uz"]}'
 */
export const bootstrapPartner = internalMutation({
  args: { partnerCode: v.string(), ...partnerFields },
  handler: async (ctx, args) => {
    const partnerId = await insertPartner(ctx, args);
    const partner = (await ctx.db.get("apiPartners", partnerId))!;
    const apiKey = generatePartnerApiKey(args.environment);
    const now = Date.now();
    await ctx.db.insert("apiPartnerKeys", {
      partnerId,
      keyHash: await hashPartnerApiKey(apiKey),
      keyPrefix: displayPrefix(apiKey),
      environment: args.environment,
      status: "active",
      expiresAt: partner.pilotEndsAt,
      createdAt: now,
      updatedAt: now,
    });
    return { partnerId, apiKey, note: "Store this key now — it is not shown again." };
  },
});
