/**
 * Partner API — internal Convex functions.
 *
 * Every function here is internal: callable only from the Next.js server with the
 * deploy key (lib/convex-server.ts → convexInternalQuery/Mutation) or from other
 * Convex functions. Nothing is reachable directly from the public Convex URL.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  LEAD_DEDUPE_WINDOW_MS,
  PARTNER_LIST_SCAN_BUDGET,
  PARTNER_MAX_PAGE_DEPTH,
  PARTNER_MAX_PAGE_SIZE,
  PARTNER_SEARCH_SCAN_BUDGET,
  buildGrantSearchText,
  fromPublicGrantId,
  isGrantPartnerVisible,
  matchesPartnerFilters,
  slugify,
  sortPartnerGrants,
  toPartnerGrant,
  toPartnerGrantDetail,
  toPublicLeadId,
  yearMonth,
  type PartnerGrantFilters,
  type PartnerGrantSort,
} from "./lib/partnerApi";

const DEFAULT_REFERRAL_BASE_URL = "https://fundingpro.uz";
const MINUTE_MS = 60_000;
const KEY_TOUCH_INTERVAL_MS = 60_000;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_LOG_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
/** Leads that never became paying clients are anonymized after 12 months (docs/partner-api/personal-data.md). */
const UNCONVERTED_LEAD_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const environmentValidator = v.union(v.literal("production"), v.literal("sandbox"));

const filtersValidator = v.object({
  sector: v.optional(v.string()),
  applicantType: v.optional(v.string()),
  country: v.optional(v.string()),
  region: v.optional(v.string()),
  fundingType: v.optional(v.string()),
  deadlineFrom: v.optional(v.number()),
  deadlineTo: v.optional(v.number()),
  status: v.optional(v.union(v.literal("open"), v.literal("upcoming"))),
  language: v.optional(v.string()),
});

const sortValidator = v.union(
  v.literal("deadline_asc"),
  v.literal("deadline_desc"),
  v.literal("published_desc"),
  v.literal("amount_desc")
);

// ---------------------------------------------------------------------------
// Authentication, limits, request journal
// ---------------------------------------------------------------------------

type BeginRequestDenied = {
  ok: false;
  code: "INVALID_API_KEY" | "EXPIRED_API_KEY" | "PARTNER_SUSPENDED" | "RATE_LIMIT_EXCEEDED";
  message: string;
  partnerId: Id<"apiPartners"> | null;
  retryAfterSec: number | null;
  rateLimit: { limit: number; remaining: number; resetAt: number } | null;
};

type BeginRequestAllowed = {
  ok: true;
  partner: {
    id: Id<"apiPartners">;
    partnerCode: string;
    name: string;
    environment: "production" | "sandbox";
    allowedDomains: string[];
    allowedIps: string[];
    allowedAppIds: string[];
    brandingRequired: boolean;
  };
  rateLimit: { limit: number; remaining: number; resetAt: number };
  monthly: { limit: number; used: number };
};

async function consumeMinuteBucket(
  ctx: MutationCtx,
  key: string,
  max: number,
  now: number
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: number }> {
  const existing = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (!existing || now > existing.resetAt) {
    const resetAt = now + MINUTE_MS;
    if (existing) await ctx.db.patch("rateLimitBuckets", existing._id, { count: 1, resetAt });
    else await ctx.db.insert("rateLimitBuckets", { key, count: 1, resetAt });
    return { allowed: true, limit: max, remaining: Math.max(0, max - 1), resetAt };
  }
  if (existing.count >= max) {
    return { allowed: false, limit: max, remaining: 0, resetAt: existing.resetAt };
  }
  await ctx.db.patch("rateLimitBuckets", existing._id, { count: existing.count + 1 });
  return { allowed: true, limit: max, remaining: Math.max(0, max - existing.count - 1), resetAt: existing.resetAt };
}

function endOfMonth(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

/**
 * Authenticates an API key (by SHA-256 hash) and consumes the per-minute and
 * monthly quotas in one transaction. Fails closed: any error → caller returns 5xx.
 */
export const beginRequest = internalMutation({
  args: { keyHash: v.string(), environment: environmentValidator },
  handler: async (ctx, args): Promise<BeginRequestAllowed | BeginRequestDenied> => {
    const now = Date.now();
    const deny = (
      code: BeginRequestDenied["code"],
      message: string,
      partnerId: Id<"apiPartners"> | null = null,
      extra: Partial<BeginRequestDenied> = {}
    ): BeginRequestDenied => ({
      ok: false,
      code,
      message,
      partnerId,
      retryAfterSec: null,
      rateLimit: null,
      ...extra,
    });

    if (!/^[0-9a-f]{64}$/.test(args.keyHash)) return deny("INVALID_API_KEY", "Invalid API key");

    const key = await ctx.db
      .query("apiPartnerKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .unique();
    if (!key || key.status !== "active" || key.environment !== args.environment) {
      return deny("INVALID_API_KEY", "Invalid API key");
    }
    if (key.expiresAt !== undefined && key.expiresAt <= now) {
      return deny("EXPIRED_API_KEY", "API key has expired", key.partnerId);
    }

    const partner = await ctx.db.get("apiPartners", key.partnerId);
    if (!partner || partner.environment !== args.environment) {
      return deny("INVALID_API_KEY", "Invalid API key");
    }
    if (partner.status !== "active") {
      return deny("PARTNER_SUSPENDED", "Partner access is suspended", partner._id);
    }
    if (partner.pilotEndsAt !== undefined && partner.pilotEndsAt <= now) {
      return deny("PARTNER_SUSPENDED", "Pilot period has ended", partner._id);
    }

    const minute = await consumeMinuteBucket(
      ctx,
      `partner:${partner._id}:min`,
      partner.requestsPerMinute,
      now
    );
    if (!minute.allowed) {
      return deny("RATE_LIMIT_EXCEEDED", "API request limit exceeded", partner._id, {
        retryAfterSec: Math.max(1, Math.ceil((minute.resetAt - now) / 1000)),
        rateLimit: { limit: minute.limit, remaining: 0, resetAt: minute.resetAt },
      });
    }

    const ym = yearMonth(now);
    const usage = await ctx.db
      .query("partnerMonthlyUsage")
      .withIndex("by_partnerId_and_yearMonth", (q) => q.eq("partnerId", partner._id).eq("yearMonth", ym))
      .unique();
    const used = usage?.requestCount ?? 0;
    if (used >= partner.monthlyRequestLimit) {
      const resetAt = endOfMonth(now);
      return deny("RATE_LIMIT_EXCEEDED", "Monthly API request limit exceeded", partner._id, {
        retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        rateLimit: { limit: partner.monthlyRequestLimit, remaining: 0, resetAt },
      });
    }
    if (usage) {
      await ctx.db.patch("partnerMonthlyUsage", usage._id, { requestCount: used + 1, updatedAt: now });
    } else {
      await ctx.db.insert("partnerMonthlyUsage", {
        partnerId: partner._id,
        yearMonth: ym,
        requestCount: 1,
        updatedAt: now,
      });
    }

    if (!key.lastUsedAt || now - key.lastUsedAt > KEY_TOUCH_INTERVAL_MS) {
      await ctx.db.patch("apiPartnerKeys", key._id, { lastUsedAt: now });
    }

    return {
      ok: true,
      partner: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        name: partner.name,
        environment: partner.environment,
        allowedDomains: partner.allowedDomains,
        allowedIps: partner.allowedIps,
        allowedAppIds: partner.allowedAppIds,
        brandingRequired: partner.brandingRequired,
      },
      rateLimit: { limit: minute.limit, remaining: minute.remaining, resetAt: minute.resetAt },
      monthly: { limit: partner.monthlyRequestLimit, used: used + 1 },
    };
  },
});

export const logRequest = internalMutation({
  args: {
    partnerId: v.id("apiPartners"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    requestId: v.string(),
    ipHash: v.optional(v.string()),
    responseTimeMs: v.number(),
    errorCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("partnerApiRequests", {
      ...args,
      endpoint: args.endpoint.slice(0, 120),
      requestId: args.requestId.slice(0, 64),
      createdAt: Date.now(),
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------

async function loadPartnerContext(ctx: QueryCtx, partnerId: Id<"apiPartners">) {
  const partner = await ctx.db.get("apiPartners", partnerId);
  if (!partner) throw new Error("Partner not found");
  return {
    partnerCode: partner.partnerCode,
    referralBaseUrl: partner.referralBaseUrl ?? DEFAULT_REFERRAL_BASE_URL,
  };
}

async function withDonors(ctx: QueryCtx, grants: Doc<"grants">[]) {
  const cache = new Map<string, Doc<"donors"> | null>();
  const out: Array<{ grant: Doc<"grants">; donor: Doc<"donors"> | null }> = [];
  for (const grant of grants) {
    if (!cache.has(grant.donorId)) cache.set(grant.donorId, await ctx.db.get("donors", grant.donorId));
    out.push({ grant, donor: cache.get(grant.donorId) ?? null });
  }
  return out;
}

function clampPaging(page: number, limit: number) {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 20), PARTNER_MAX_PAGE_SIZE);
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), PARTNER_MAX_PAGE_DEPTH);
  return { page: safePage, limit: safeLimit };
}

export const listGrants = internalQuery({
  args: {
    partnerId: v.id("apiPartners"),
    filters: filtersValidator,
    sort: sortValidator,
    page: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pctx = await loadPartnerContext(ctx, args.partnerId);
    const { page, limit } = clampPaging(args.page, args.limit);

    const matched: Doc<"grants">[] = [];
    let scanned = 0;
    for await (const grant of ctx.db
      .query("grants")
      .withIndex("by_partnerVisible_and_isActive_and_deadline", (q) =>
        q.eq("partnerVisible", true).eq("isActive", true)
      )) {
      scanned += 1;
      if (isGrantPartnerVisible(grant, now) && matchesPartnerFilters(grant, args.filters as PartnerGrantFilters, now)) {
        matched.push(grant);
      }
      if (scanned >= PARTNER_LIST_SCAN_BUDGET) break;
    }

    const sorted = sortPartnerGrants(matched, args.sort as PartnerGrantSort);
    const slice = sorted.slice((page - 1) * limit, page * limit);
    const rows = await withDonors(ctx, slice);
    const total = sorted.length;
    return {
      data: rows.map(({ grant, donor }) => toPartnerGrant(grant, donor, { now, ...pctx })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.min(Math.ceil(total / limit), PARTNER_MAX_PAGE_DEPTH),
        has_more: page * limit < total && page < PARTNER_MAX_PAGE_DEPTH,
      },
    };
  },
});

export const searchGrants = internalQuery({
  args: {
    partnerId: v.id("apiPartners"),
    q: v.string(),
    filters: filtersValidator,
    page: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pctx = await loadPartnerContext(ctx, args.partnerId);
    const { page, limit } = clampPaging(args.page, args.limit);
    const q = args.q.trim().slice(0, 200);

    const candidates = q
      ? await ctx.db
          .query("grants")
          .withSearchIndex("search_partner_text", (s) =>
            s.search("searchText", q).eq("partnerVisible", true).eq("isActive", true)
          )
          .take(PARTNER_SEARCH_SCAN_BUDGET)
      : [];

    const matched = candidates.filter(
      (g) => isGrantPartnerVisible(g, now) && matchesPartnerFilters(g, args.filters as PartnerGrantFilters, now)
    );
    const slice = matched.slice((page - 1) * limit, page * limit);
    const rows = await withDonors(ctx, slice);
    const total = matched.length;
    return {
      data: rows.map(({ grant, donor }) => toPartnerGrant(grant, donor, { now, ...pctx })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.min(Math.ceil(total / limit), PARTNER_MAX_PAGE_DEPTH),
        has_more: page * limit < total && page < PARTNER_MAX_PAGE_DEPTH,
      },
    };
  },
});

async function resolveVisibleGrant(ctx: QueryCtx, publicId: string, now: number) {
  const raw = fromPublicGrantId(publicId);
  let grant: Doc<"grants"> | null = null;
  if (raw) {
    const id = ctx.db.normalizeId("grants", raw);
    if (id) grant = await ctx.db.get("grants", id);
  }
  if (!grant && /^[a-z0-9-]{3,80}$/.test(publicId)) {
    grant = await ctx.db
      .query("grants")
      .withIndex("by_slug", (q) => q.eq("slug", publicId))
      .first();
  }
  if (!grant || !isGrantPartnerVisible(grant, now)) return null;
  return grant;
}

export const getGrant = internalQuery({
  args: { partnerId: v.id("apiPartners"), grantId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pctx = await loadPartnerContext(ctx, args.partnerId);
    const grant = await resolveVisibleGrant(ctx, args.grantId, now);
    if (!grant) return null;
    const donor = await ctx.db.get("donors", grant.donorId);
    return toPartnerGrantDetail(grant, donor, { now, ...pctx });
  },
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

function randomToken(bytes = 12): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

const leadInputValidator = v.object({
  grantId: v.string(),
  fullName: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  organizationName: v.optional(v.string()),
  applicantType: v.optional(v.string()),
  region: v.optional(v.string()),
  preferredLanguage: v.optional(v.string()),
  message: v.optional(v.string()),
  consentToContact: v.boolean(),
  consentTextVersion: v.string(),
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  externalUserId: v.optional(v.string()),
});

type SubmitLeadResult =
  | {
      ok: true;
      leadId: string;
      referralId: string;
      createdAt: number;
      duplicate: boolean;
      isTest: boolean;
      grantTitle: string;
    }
  | { ok: false; code: "CONSENT_REQUIRED" | "GRANT_NOT_FOUND" | "IDEMPOTENCY_CONFLICT" | "INVALID_REQUEST"; message: string };

async function findRecentDuplicate(
  ctx: MutationCtx,
  partnerId: Id<"apiPartners">,
  grantId: Id<"grants">,
  phone: string | undefined,
  email: string | undefined,
  since: number
): Promise<Doc<"partnerLeads"> | null> {
  if (phone) {
    const byPhone = await ctx.db
      .query("partnerLeads")
      .withIndex("by_partnerId_and_grantId_and_phone", (q) =>
        q.eq("partnerId", partnerId).eq("grantId", grantId).eq("phone", phone)
      )
      .order("desc")
      .take(5);
    const hit = byPhone.find((l) => l.lastContactAt >= since && !l.anonymizedAt);
    if (hit) return hit;
  }
  if (email) {
    const byEmail = await ctx.db
      .query("partnerLeads")
      .withIndex("by_partnerId_and_grantId_and_email", (q) =>
        q.eq("partnerId", partnerId).eq("grantId", grantId).eq("email", email)
      )
      .order("desc")
      .take(5);
    const hit = byEmail.find((l) => l.lastContactAt >= since && !l.anonymizedAt);
    if (hit) return hit;
  }
  return null;
}

/**
 * Creates (or de-duplicates) a partner lead. Inputs must already be validated and
 * normalized by the route (lib/partner-api/validation.ts); this function re-checks
 * the invariants that protect data integrity.
 */
export const submitLead = internalMutation({
  args: {
    partnerId: v.id("apiPartners"),
    lead: leadInputValidator,
    idempotencyKey: v.optional(v.string()),
    requestHash: v.string(),
  },
  handler: async (ctx, args): Promise<SubmitLeadResult> => {
    const now = Date.now();
    const partner = await ctx.db.get("apiPartners", args.partnerId);
    if (!partner) return { ok: false, code: "INVALID_REQUEST", message: "Unknown partner" };
    const isTest = partner.environment === "sandbox";
    const lead = args.lead;

    if (lead.consentToContact !== true) {
      return { ok: false, code: "CONSENT_REQUIRED", message: "consent_to_contact must be true" };
    }
    if (!lead.phone && !lead.email) {
      return { ok: false, code: "INVALID_REQUEST", message: "phone or email is required" };
    }

    if (args.idempotencyKey) {
      const prior = await ctx.db
        .query("partnerIdempotencyKeys")
        .withIndex("by_partnerId_and_key", (q) => q.eq("partnerId", partner._id).eq("key", args.idempotencyKey!))
        .unique();
      if (prior && prior.expiresAt > now) {
        if (prior.requestHash !== args.requestHash) {
          return {
            ok: false,
            code: "IDEMPOTENCY_CONFLICT",
            message: "Idempotency-Key was already used with a different request body",
          };
        }
        const existing = await ctx.db.get("partnerLeads", prior.leadId);
        if (existing) {
          const grant = await ctx.db.get("grants", existing.grantId);
          return {
            ok: true,
            leadId: toPublicLeadId(existing._id),
            referralId: existing.referralId,
            createdAt: existing.createdAt,
            duplicate: prior.duplicate,
            isTest: existing.isTest,
            grantTitle: grant?.title ?? "",
          };
        }
      } else if (prior) {
        await ctx.db.delete("partnerIdempotencyKeys", prior._id);
      }
    }

    const grant = await resolveVisibleGrant(ctx, lead.grantId, now);
    if (!grant) return { ok: false, code: "GRANT_NOT_FOUND", message: "Grant not found" };

    const duplicate = await findRecentDuplicate(
      ctx,
      partner._id,
      grant._id,
      lead.phone,
      lead.email,
      now - LEAD_DEDUPE_WINDOW_MS
    );

    let leadDocId: Id<"partnerLeads">;
    let referralId: string;
    let createdAt: number;
    if (duplicate) {
      await ctx.db.patch("partnerLeads", duplicate._id, {
        lastContactAt: now,
        contactCount: duplicate.contactCount + 1,
        updatedAt: now,
      });
      await ctx.db.insert("partnerLeadEvents", {
        leadId: duplicate._id,
        type: "repeat_contact",
        note: lead.message ? lead.message.slice(0, 2000) : undefined,
        createdAt: now,
      });
      leadDocId = duplicate._id;
      referralId = duplicate.referralId;
      createdAt = duplicate.createdAt;
    } else {
      referralId = `ref_${randomToken(10)}`;
      createdAt = now;
      leadDocId = await ctx.db.insert("partnerLeads", {
        partnerId: partner._id,
        grantId: grant._id,
        referralId,
        source: "partner_api",
        externalUserId: lead.externalUserId,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        organizationName: lead.organizationName,
        applicantType: lead.applicantType,
        region: lead.region,
        preferredLanguage: lead.preferredLanguage,
        message: lead.message,
        consentToContact: true,
        consentTextVersion: lead.consentTextVersion,
        consentAt: now,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        status: "new",
        firstContactAt: now,
        lastContactAt: now,
        contactCount: 1,
        paymentReceived: false,
        isTest,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("partnerLeadEvents", { leadId: leadDocId, type: "created", toStatus: "new", createdAt: now });
    }

    await ctx.db.insert("partnerEvents", {
      partnerId: partner._id,
      grantId: grant._id,
      externalUserId: lead.externalUserId,
      eventType: "lead_submitted",
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      isTest,
      createdAt: now,
    });

    if (args.idempotencyKey) {
      await ctx.db.insert("partnerIdempotencyKeys", {
        partnerId: partner._id,
        key: args.idempotencyKey,
        requestHash: args.requestHash,
        leadId: leadDocId,
        duplicate: Boolean(duplicate),
        expiresAt: now + IDEMPOTENCY_TTL_MS,
        createdAt: now,
      });
    }

    return {
      ok: true,
      leadId: toPublicLeadId(leadDocId),
      referralId,
      createdAt,
      duplicate: Boolean(duplicate),
      isTest,
      grantTitle: grant.title,
    };
  },
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const eventTypeValidator = v.union(
  v.literal("grant_view"),
  v.literal("grant_click"),
  v.literal("consultation_click"),
  v.literal("lead_started"),
  v.literal("lead_submitted"),
  v.literal("official_source_click")
);

export const recordEvents = internalMutation({
  args: {
    partnerId: v.id("apiPartners"),
    events: v.array(
      v.object({
        eventType: eventTypeValidator,
        grantId: v.optional(v.string()),
        externalUserId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        utmSource: v.optional(v.string()),
        utmMedium: v.optional(v.string()),
        utmCampaign: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({ accepted: v.number(), rejected: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const partner = await ctx.db.get("apiPartners", args.partnerId);
    if (!partner) throw new Error("Partner not found");
    const isTest = partner.environment === "sandbox";
    let accepted = 0;
    let rejected = 0;
    for (const event of args.events.slice(0, 50)) {
      let grantId: Id<"grants"> | undefined;
      if (event.grantId) {
        const grant = await resolveVisibleGrant(ctx, event.grantId, now);
        if (!grant) {
          rejected += 1;
          continue;
        }
        grantId = grant._id;
      }
      await ctx.db.insert("partnerEvents", {
        partnerId: partner._id,
        grantId,
        externalUserId: event.externalUserId,
        eventType: event.eventType,
        sessionId: event.sessionId,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        isTest,
        createdAt: now,
      });
      accepted += 1;
    }
    return { accepted, rejected };
  },
});

// ---------------------------------------------------------------------------
// Maintenance (crons)
// ---------------------------------------------------------------------------

export const purgeExpired = internalMutation({
  args: {},
  returns: v.object({ requests: v.number(), idempotencyKeys: v.number(), anonymizedLeads: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const oldRequests = await ctx.db
      .query("partnerApiRequests")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", now - REQUEST_LOG_RETENTION_MS))
      .take(500);
    for (const row of oldRequests) await ctx.db.delete("partnerApiRequests", row._id);

    const oldKeys = await ctx.db
      .query("partnerIdempotencyKeys")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(500);
    for (const row of oldKeys) await ctx.db.delete("partnerIdempotencyKeys", row._id);

    let anonymizedLeads = 0;
    const staleLeads = await ctx.db
      .query("partnerLeads")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", now - UNCONVERTED_LEAD_RETENTION_MS))
      .take(200);
    for (const lead of staleLeads) {
      if (lead.anonymizedAt || lead.paymentReceived || lead.lastContactAt >= now - UNCONVERTED_LEAD_RETENTION_MS) {
        continue;
      }
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
      await ctx.db.insert("partnerLeadEvents", { leadId: lead._id, type: "anonymized", note: "retention", createdAt: now });
      anonymizedLeads += 1;
    }

    if (oldRequests.length === 500 || oldKeys.length === 500) {
      await ctx.scheduler.runAfter(0, internal.partnerApi.purgeExpired, {});
    }
    return { requests: oldRequests.length, idempotencyKeys: oldKeys.length, anonymizedLeads };
  },
});

/**
 * Backfills slug / searchText / publishedAt for existing grants. Does NOT publish
 * anything to partners: `partnerVisible` stays unset until an editor verifies the grant.
 * Run: npx convex run partnerApi:backfillGrantPartnerFields '{}'
 */
export const backfillGrantPartnerFields = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ updated: v.number(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    const batch = await ctx.db.query("grants").paginate({ numItems: 100, cursor: args.cursor ?? null });
    let updated = 0;
    for (const grant of batch.page) {
      const donor = await ctx.db.get("donors", grant.donorId);
      const patch: Partial<Doc<"grants">> = {
        searchText: buildGrantSearchText(grant, donor),
      };
      if (!grant.slug) patch.slug = `${slugify(grant.title) || "grant"}-${grant._id.slice(-6)}`;
      if (grant.publishedAt === undefined) patch.publishedAt = grant.createdAt;
      await ctx.db.patch("grants", grant._id, patch);
      updated += 1;
    }
    if (!batch.isDone) {
      await ctx.scheduler.runAfter(0, internal.partnerApi.backfillGrantPartnerFields, {
        cursor: batch.continueCursor,
      });
    }
    return { updated, isDone: batch.isDone };
  },
});

/** Recompute searchText for one grant (called after admin edits). */
export async function refreshGrantSearchText(ctx: MutationCtx, grantId: Id<"grants">): Promise<void> {
  const grant = await ctx.db.get("grants", grantId);
  if (!grant) return;
  const donor = await ctx.db.get("donors", grant.donorId);
  await ctx.db.patch("grants", grantId, { searchText: buildGrantSearchText(grant, donor) });
}
