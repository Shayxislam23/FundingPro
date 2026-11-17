/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { PARTNER_GRANT_DETAIL_EXTRA_KEYS, PARTNER_GRANT_KEYS, buildGrantSearchText } from "./lib/partnerApi";
import { generatePartnerApiKey, hashPartnerApiKey } from "./lib/partnerKeys";

const modules = import.meta.glob("./**/*.ts");
const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.unstubAllEnvs();
});

async function seedDonor(ctx: MutationCtx) {
  const now = Date.now();
  return ctx.db.insert("donors", {
    name: "Example Foundation",
    country: "Germany",
    type: "foundation",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

type GrantOverrides = Partial<{
  title: string;
  partnerVisible: boolean;
  isActive: boolean;
  status: string;
  deadline: number | undefined;
  verificationStatus: "verified" | "unverified" | "invalid";
  sectors: string[];
  applicantTypes: string[];
  eligibleRegions: string[];
  isFeatured: boolean;
}>;

async function seedGrant(ctx: MutationCtx, donorId: Id<"donors">, o: GrantOverrides = {}) {
  const now = Date.now();
  const doc = {
    title: o.title ?? "Green Innovation Grant",
    titleRu: "Грант зелёных инноваций",
    description: "Support for climate-smart SMEs in Uzbekistan.",
    donorId,
    sectors: o.sectors ?? ["climate", "agriculture"],
    countryScope: ["Uzbekistan"],
    applicantTypes: o.applicantTypes ?? ["Business", "NGO"],
    eligibleRegions: o.eligibleRegions ?? ["All Uzbekistan"],
    amountMin: 10000,
    amountMax: 100000,
    currency: "USD",
    deadline: "deadline" in o ? o.deadline : now + 60 * DAY,
    sourceUrl: "https://official.example/grant",
    status: o.status ?? "open",
    isActive: o.isActive ?? true,
    isFeatured: o.isFeatured ?? true,
    partnerVisible: o.partnerVisible ?? true,
    verificationStatus: o.verificationStatus ?? ("verified" as const),
    lastVerifiedAt: now,
    publishedAt: now,
    tags: ["green"],
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const id = await ctx.db.insert("grants", doc);
  const donor = await ctx.db.get("donors", donorId);
  await ctx.db.patch("grants", id, { searchText: buildGrantSearchText(doc, donor) });
  return id;
}

type PartnerOverrides = Partial<{
  partnerCode: string;
  environment: "production" | "sandbox";
  status: "active" | "suspended" | "terminated";
  requestsPerMinute: number;
  monthlyRequestLimit: number;
  pilotEndsAt: number;
  commissionRule: "first_paid_order" | "every_paid_order" | "none";
}>;

async function seedPartner(ctx: MutationCtx, o: PartnerOverrides = {}) {
  const now = Date.now();
  return ctx.db.insert("apiPartners", {
    partnerCode: o.partnerCode ?? "jizzakh_business_platform",
    name: "Jizzakh Business Platform",
    status: o.status ?? "active",
    environment: o.environment ?? "production",
    allowedDomains: [],
    allowedIps: [],
    allowedAppIds: [],
    monthlyRequestLimit: o.monthlyRequestLimit ?? 5000,
    requestsPerMinute: o.requestsPerMinute ?? 60,
    pilotStartedAt: now,
    pilotEndsAt: o.pilotEndsAt ?? now + 30 * DAY,
    plan: "pilot",
    brandingRequired: true,
    commissionPercentage: 10,
    commissionRule: o.commissionRule ?? "first_paid_order",
    createdAt: now,
    updatedAt: now,
  });
}

async function seedKey(
  ctx: MutationCtx,
  partnerId: Id<"apiPartners">,
  o: Partial<{ status: "active" | "revoked"; expiresAt: number; environment: "production" | "sandbox" }> = {}
) {
  const env = o.environment ?? "production";
  const key = generatePartnerApiKey(env);
  const now = Date.now();
  await ctx.db.insert("apiPartnerKeys", {
    partnerId,
    keyHash: await hashPartnerApiKey(key),
    keyPrefix: key.slice(0, 12),
    environment: env,
    status: o.status ?? "active",
    expiresAt: o.expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  return key;
}

async function seedAdmin(ctx: MutationCtx) {
  const now = Date.now();
  return ctx.db.insert("users", {
    clerkId: "clerk_admin",
    tokenIdentifier: "token:admin",
    email: "admin@test.local",
    emailVerified: true,
    isActive: true,
    isBanned: false,
    platformRole: "admin",
    createdAt: now,
    updatedAt: now,
  });
}

const adminIdentity = { tokenIdentifier: "token:admin", subject: "clerk_admin" };

function leadInput(grantId: string, o: Record<string, unknown> = {}) {
  return {
    grantId,
    fullName: "Ali Valiyev",
    phone: "+998901234567",
    email: "ali@example.com",
    organizationName: "Jizzakh Agro Tech LLC",
    applicantType: "business",
    region: "Jizzakh",
    consentToContact: true,
    consentTextVersion: "v1.0",
    utmSource: "jizzakh_platform",
    externalUserId: "partner_user_98765",
    ...o,
  };
}

async function setup(partner: PartnerOverrides = {}) {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const donorId = await seedDonor(ctx);
    const grantId = await seedGrant(ctx, donorId);
    const partnerId = await seedPartner(ctx, partner);
    const key = await seedKey(ctx, partnerId, { environment: partner.environment ?? "production" });
    return { donorId, grantId, partnerId, key };
  });
  return { t, ...ids, publicGrantId: `grant_${ids.grantId}` };
}

// ---------------------------------------------------------------------------

describe("partner authentication", () => {
  test("accepts a valid key and returns partner config (no commercial fields)", async () => {
    const { t, key } = await setup();
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(key),
      environment: "production",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.partner.partnerCode).toBe("jizzakh_business_platform");
    expect(res.partner).not.toHaveProperty("commissionPercentage");
    expect(res.monthly.used).toBe(1);
  });

  test("rejects an unknown key", async () => {
    const { t } = await setup();
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(generatePartnerApiKey("production")),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "INVALID_API_KEY" });
  });

  test("rejects a malformed hash", async () => {
    const { t } = await setup();
    const res = await t.mutation(internal.partnerApi.beginRequest, { keyHash: "abc", environment: "production" });
    expect(res).toMatchObject({ ok: false, code: "INVALID_API_KEY" });
  });

  test("rejects an expired key", async () => {
    const { t, partnerId } = await setup();
    const expired = await t.run((ctx) => seedKey(ctx, partnerId, { expiresAt: Date.now() - 1000 }));
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(expired),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "EXPIRED_API_KEY" });
  });

  test("rejects a revoked key", async () => {
    const { t, partnerId } = await setup();
    const revoked = await t.run((ctx) => seedKey(ctx, partnerId, { status: "revoked" }));
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(revoked),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "INVALID_API_KEY" });
  });

  test("rejects a suspended partner", async () => {
    const { t, key } = await setup({ status: "suspended" });
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(key),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "PARTNER_SUSPENDED" });
  });

  test("rejects requests after the pilot ends", async () => {
    const { t, key } = await setup({ pilotEndsAt: Date.now() - 1000 });
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(key),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "PARTNER_SUSPENDED", message: "Pilot period has ended" });
  });

  test("a sandbox key never works against the production environment", async () => {
    const { t, key } = await setup({ environment: "sandbox" });
    const res = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(key),
      environment: "production",
    });
    expect(res).toMatchObject({ ok: false, code: "INVALID_API_KEY" });
  });

  test("enforces the per-minute limit", async () => {
    const { t, key } = await setup({ requestsPerMinute: 3 });
    const keyHash = await hashPartnerApiKey(key);
    for (let i = 0; i < 3; i++) {
      const ok = await t.mutation(internal.partnerApi.beginRequest, { keyHash, environment: "production" });
      expect(ok.ok).toBe(true);
    }
    const res = await t.mutation(internal.partnerApi.beginRequest, { keyHash, environment: "production" });
    expect(res).toMatchObject({ ok: false, code: "RATE_LIMIT_EXCEEDED" });
    if (!res.ok) expect(res.retryAfterSec).toBeGreaterThan(0);
  });

  test("enforces the monthly limit", async () => {
    const { t, key } = await setup({ monthlyRequestLimit: 2 });
    const keyHash = await hashPartnerApiKey(key);
    await t.mutation(internal.partnerApi.beginRequest, { keyHash, environment: "production" });
    await t.mutation(internal.partnerApi.beginRequest, { keyHash, environment: "production" });
    const res = await t.mutation(internal.partnerApi.beginRequest, { keyHash, environment: "production" });
    expect(res).toMatchObject({ ok: false, code: "RATE_LIMIT_EXCEEDED", message: "Monthly API request limit exceeded" });
  });
});

describe("partner grants", () => {
  test("returns only published, current, verified grants with whitelisted fields", async () => {
    const { t, donorId, partnerId } = await setup();
    await t.run(async (ctx) => {
      await seedGrant(ctx, donorId, { title: "Hidden draft", partnerVisible: false });
      await seedGrant(ctx, donorId, { title: "Closed", status: "closed" });
      await seedGrant(ctx, donorId, { title: "Expired", deadline: Date.now() - DAY });
      await seedGrant(ctx, donorId, { title: "Invalid", verificationStatus: "invalid" });
      await seedGrant(ctx, donorId, { title: "Inactive", isActive: false });
    });

    const res = await t.query(internal.partnerApi.listGrants, {
      partnerId,
      filters: {},
      sort: "deadline_asc",
      page: 1,
      limit: 20,
    });
    expect(res.data.map((g) => g.title)).toEqual(["Green Innovation Grant"]);
    const grant = res.data[0];
    expect(Object.keys(grant).sort()).toEqual([...PARTNER_GRANT_KEYS].sort());
    expect(Object.keys(grant.donor).sort()).toEqual(["country", "name", "type"]);
    // Internal fields must never leak.
    const json = JSON.stringify(res);
    for (const internalField of ["isFeatured", "searchText", "partnerVisible", "fit_score", "donorId", "_creationTime"]) {
      expect(json).not.toContain(internalField);
    }
    expect(grant.applicant_types).toEqual(["business", "ngo"]);
    expect(grant.referral_url).toContain("partner_id=jizzakh_business_platform");
    expect(grant.flags.available_in_uzbekistan).toBe(true);
  });

  test("filters by sector, applicant type and region", async () => {
    const { t, donorId, partnerId } = await setup();
    await t.run(async (ctx) => {
      await seedGrant(ctx, donorId, {
        title: "Jizzakh agro",
        sectors: ["agriculture"],
        applicantTypes: ["Business"],
        eligibleRegions: ["Jizzakh"],
      });
      await seedGrant(ctx, donorId, {
        title: "Samarkand NGO",
        sectors: ["education"],
        applicantTypes: ["NGO"],
        eligibleRegions: ["Samarkand"],
      });
    });
    const list = (filters: Record<string, string>) =>
      t.query(internal.partnerApi.listGrants, { partnerId, filters, sort: "deadline_asc", page: 1, limit: 50 });

    expect((await list({ sector: "education" })).data.map((g) => g.title)).toEqual(["Samarkand NGO"]);
    expect((await list({ applicantType: "business" })).data.map((g) => g.title).sort()).toEqual([
      "Green Innovation Grant",
      "Jizzakh agro",
    ]);
    // "All Uzbekistan" grants match any region.
    expect((await list({ region: "Jizzakh" })).data.map((g) => g.title).sort()).toEqual([
      "Green Innovation Grant",
      "Jizzakh agro",
    ]);
  });

  test("caps page size at 50 and page depth at 20", async () => {
    const { t, partnerId } = await setup();
    const res = await t.query(internal.partnerApi.listGrants, {
      partnerId,
      filters: {},
      sort: "deadline_asc",
      page: 999,
      limit: 1000,
    });
    expect(res.pagination.limit).toBe(50);
    expect(res.pagination.page).toBe(20);
  });

  test("getGrant returns detail for published grant and null for hidden or missing", async () => {
    const { t, donorId, partnerId, publicGrantId } = await setup();
    const hiddenId = await t.run((ctx) => seedGrant(ctx, donorId, { partnerVisible: false }));

    const detail = await t.query(internal.partnerApi.getGrant, { partnerId, grantId: publicGrantId });
    expect(detail).not.toBeNull();
    expect(Object.keys(detail!).sort()).toEqual([...PARTNER_GRANT_KEYS, ...PARTNER_GRANT_DETAIL_EXTRA_KEYS].sort());

    expect(await t.query(internal.partnerApi.getGrant, { partnerId, grantId: `grant_${hiddenId}` })).toBeNull();
    expect(await t.query(internal.partnerApi.getGrant, { partnerId, grantId: "grant_doesnotexist000000" })).toBeNull();
  });

  test("full-text search finds by donor and tag", async () => {
    const { t, partnerId } = await setup();
    const byDonor = await t.query(internal.partnerApi.searchGrants, {
      partnerId,
      q: "Example Foundation",
      filters: {},
      page: 1,
      limit: 10,
    });
    expect(byDonor.data).toHaveLength(1);
    const byTag = await t.query(internal.partnerApi.searchGrants, { partnerId, q: "green", filters: {}, page: 1, limit: 10 });
    expect(byTag.data).toHaveLength(1);
  });
});

describe("partner leads", () => {
  test("creates a lead with source attribution", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const res = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      requestHash: "h1",
    });
    expect(res).toMatchObject({ ok: true, duplicate: false, isTest: false });
    if (!res.ok) return;
    expect(res.leadId).toMatch(/^lead_/);
    const lead = await t.run((ctx) =>
      ctx.db.get("partnerLeads", res.leadId.slice(5) as Id<"partnerLeads">)
    );
    expect(lead).toMatchObject({
      partnerId,
      source: "partner_api",
      status: "new",
      consentTextVersion: "v1.0",
      utmSource: "jizzakh_platform",
      referralId: res.referralId,
    });
  });

  test("refuses to create a lead without consent", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const res = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId, { consentToContact: false }),
      requestHash: "h1",
    });
    expect(res).toMatchObject({ ok: false, code: "CONSENT_REQUIRED" });
    const count = await t.run(async (ctx) => (await ctx.db.query("partnerLeads").take(10)).length);
    expect(count).toBe(0);
  });

  test("rejects leads for unpublished grants", async () => {
    const { t, donorId, partnerId } = await setup();
    const hidden = await t.run((ctx) => seedGrant(ctx, donorId, { partnerVisible: false }));
    const res = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(`grant_${hidden}`),
      requestHash: "h1",
    });
    expect(res).toMatchObject({ ok: false, code: "GRANT_NOT_FOUND" });
  });

  test("de-duplicates a repeat within 30 days (phone OR email) and records the repeat", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const first = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      requestHash: "h1",
    });
    const second = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId, { phone: undefined, message: "again" }),
      requestHash: "h2",
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.duplicate).toBe(true);
    expect(second.leadId).toBe(first.leadId);
    const leads = await t.run((ctx) => ctx.db.query("partnerLeads").take(10));
    expect(leads).toHaveLength(1);
    expect(leads[0].contactCount).toBe(2);
    const events = await t.run((ctx) =>
      ctx.db.query("partnerLeadEvents").withIndex("by_leadId", (q) => q.eq("leadId", leads[0]._id)).take(10)
    );
    expect(events.map((e) => e.type).sort()).toEqual(["created", "repeat_contact"]);
  });

  test("creates a new lead after the 30-day window", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    await t.mutation(internal.partnerApi.submitLead, { partnerId, lead: leadInput(publicGrantId), requestHash: "h1" });
    await t.run(async (ctx) => {
      const lead = (await ctx.db.query("partnerLeads").first())!;
      await ctx.db.patch("partnerLeads", lead._id, { lastContactAt: Date.now() - 31 * DAY });
    });
    const res = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      requestHash: "h2",
    });
    expect(res).toMatchObject({ ok: true, duplicate: false });
  });

  test("idempotency: same key + same body returns the same lead; different body conflicts", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const key = "6f1c2b8e-4a0d-4c1e-9b7a-3d2e1f0a9b8c";
    const a = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      idempotencyKey: key,
      requestHash: "same",
    });
    const b = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      idempotencyKey: key,
      requestHash: "same",
    });
    expect(a.ok && b.ok && a.leadId === b.leadId).toBe(true);
    const c = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId, { fullName: "Someone Else" }),
      idempotencyKey: key,
      requestHash: "different",
    });
    expect(c).toMatchObject({ ok: false, code: "IDEMPOTENCY_CONFLICT" });
    const leadCount = await t.run(async (ctx) => (await ctx.db.query("partnerLeads").take(10)).length);
    expect(leadCount).toBe(1);
  });

  test("sandbox leads are flagged is_test", async () => {
    const { t, partnerId, publicGrantId } = await setup({ environment: "sandbox" });
    const res = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      requestHash: "h1",
    });
    expect(res).toMatchObject({ ok: true, isTest: true });
  });

  test("partners are isolated: the same person on another partner is a separate lead and report", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const otherPartner = await t.run((ctx) => seedPartner(ctx, { partnerCode: "other_partner" }));
    await t.mutation(internal.partnerApi.submitLead, { partnerId, lead: leadInput(publicGrantId), requestHash: "a" });
    const other = await t.mutation(internal.partnerApi.submitLead, {
      partnerId: otherPartner,
      lead: leadInput(publicGrantId),
      requestHash: "b",
    });
    expect(other).toMatchObject({ ok: true, duplicate: false });

    await t.run((ctx) => seedAdmin(ctx));
    const asAdmin = t.withIdentity(adminIdentity);
    const period = new Date().toISOString().slice(0, 7);
    const report = await asAdmin.query(api.partnerAdmin.partnerReport, { partnerId, period });
    expect(report.partner_id).toBe("jizzakh_business_platform");
    expect(report.leads_submitted).toBe(1);
    const leadsA = await asAdmin.query(api.partnerAdmin.listLeads, { partnerId });
    expect(leadsA.every((l) => l.partnerCode === "jizzakh_business_platform")).toBe(true);
  });
});

describe("events and report", () => {
  test("records events and aggregates them in the monthly report", async () => {
    const { t, partnerId, publicGrantId, key } = await setup();
    await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(key),
      environment: "production",
    });
    const res = await t.mutation(internal.partnerApi.recordEvents, {
      partnerId,
      events: [
        { eventType: "grant_view", grantId: publicGrantId, externalUserId: "u1" },
        { eventType: "grant_view", grantId: publicGrantId, externalUserId: "u1" },
        { eventType: "grant_view", grantId: publicGrantId, externalUserId: "u2" },
        { eventType: "consultation_click", grantId: publicGrantId },
        { eventType: "official_source_click", grantId: publicGrantId },
        { eventType: "grant_view", grantId: "grant_unknown00000000000" },
      ],
    });
    expect(res).toEqual({ accepted: 5, rejected: 1 });

    await t.run((ctx) => seedAdmin(ctx));
    const report = await t
      .withIdentity(adminIdentity)
      .query(api.partnerAdmin.partnerReport, { partnerId, period: new Date().toISOString().slice(0, 7) });
    expect(report).toMatchObject({
      api_requests: 1,
      grant_views: 3,
      unique_grant_views: 2,
      consultation_clicks: 1,
      official_source_clicks: 1,
    });
    expect(report.top_grants[0].views).toBe(3);
  });
});

describe("referral commissions", () => {
  test("commission is created only from received payment, and only for the first paid order", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    const lead = await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId),
      requestHash: "h",
    });
    if (!lead.ok) throw new Error("lead failed");
    await t.run((ctx) => seedAdmin(ctx));
    const asAdmin = t.withIdentity(adminIdentity);
    const leadId = lead.leadId.slice(5) as Id<"partnerLeads">;

    await expect(asAdmin.mutation(api.partnerAdmin.updateLead, { leadId, status: "paid" })).rejects.toThrow();

    const first = await asAdmin.mutation(api.partnerAdmin.recordLeadPayment, {
      leadId,
      amount: 10_000_000,
      currency: "UZS",
    });
    expect(first.commissionAmount).toBe(1_000_000);
    const second = await asAdmin.mutation(api.partnerAdmin.recordLeadPayment, { leadId, amount: 5_000_000, currency: "UZS" });
    expect(second.commissionId).toBeNull();

    const commissions = await asAdmin.query(api.partnerAdmin.listCommissions, { partnerId });
    expect(commissions).toHaveLength(1);
    expect(commissions[0]).toMatchObject({ commissionPercentage: 10, status: "pending", currency: "UZS" });

    const report = await asAdmin.query(api.partnerAdmin.partnerReport, {
      partnerId,
      period: new Date().toISOString().slice(0, 7),
    });
    expect(report.paid_clients).toBe(1);
  });

  test("admin functions reject non-admins", async () => {
    const { t, partnerId } = await setup();
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("users", {
        clerkId: "clerk_user",
        tokenIdentifier: "token:user",
        email: "u@test.local",
        emailVerified: true,
        isActive: true,
        isBanned: false,
        platformRole: "user",
        createdAt: now,
        updatedAt: now,
      });
    });
    const asUser = t.withIdentity({ tokenIdentifier: "token:user", subject: "clerk_user" });
    await expect(asUser.query(api.partnerAdmin.listLeads, { partnerId })).rejects.toThrow();
    await expect(asUser.query(api.partnerAdmin.listPartners, {})).rejects.toThrow();
  });
});

describe("personal data", () => {
  test("anonymizes leads by phone on user request", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    await t.mutation(internal.partnerApi.submitLead, { partnerId, lead: leadInput(publicGrantId), requestHash: "h" });
    await t.run((ctx) => seedAdmin(ctx));
    const res = await t
      .withIdentity(adminIdentity)
      .mutation(api.partnerAdmin.anonymizeLeadsByContact, { phone: "90 123 45 67" });
    expect(res.anonymized).toBe(1);
    const lead = await t.run((ctx) => ctx.db.query("partnerLeads").first());
    expect(lead?.fullName).toBe("[deleted]");
    expect(lead?.phone).toBeUndefined();
    expect(lead?.email).toBeUndefined();
    expect(lead?.organizationName).toBeUndefined();
    expect(lead?.anonymizedAt).toBeTypeOf("number");
  });
});

describe("retention", () => {
  test("anonymizes unconverted leads after 12 months, keeps paying clients", async () => {
    const { t, partnerId, publicGrantId } = await setup();
    await t.mutation(internal.partnerApi.submitLead, { partnerId, lead: leadInput(publicGrantId), requestHash: "a" });
    await t.mutation(internal.partnerApi.submitLead, {
      partnerId,
      lead: leadInput(publicGrantId, { phone: "+998907777777", email: "paid@example.com" }),
      requestHash: "b",
    });
    await t.run(async (ctx) => {
      const old = Date.now() - 400 * DAY;
      const leads = await ctx.db.query("partnerLeads").take(10);
      for (const l of leads) {
        await ctx.db.patch("partnerLeads", l._id, {
          createdAt: old,
          lastContactAt: old,
          paymentReceived: l.email === "paid@example.com",
        });
      }
    });
    const res = await t.mutation(internal.partnerApi.purgeExpired, {});
    expect(res.anonymizedLeads).toBe(1);
    const leads = await t.run((ctx) => ctx.db.query("partnerLeads").take(10));
    expect(leads.find((l) => l.paymentReceived)?.fullName).toBe("Ali Valiyev");
    expect(leads.find((l) => !l.paymentReceived)?.fullName).toBe("[deleted]");
  });
});

describe("editorial publication", () => {
  test("a grant cannot be published to partners before its source is verified", async () => {
    const t = convexTest(schema, modules);
    const grantId = await t.run(async (ctx) => {
      await seedAdmin(ctx);
      const donorId = await seedDonor(ctx);
      const id = await seedGrant(ctx, donorId, { partnerVisible: false });
      await ctx.db.patch("grants", id, { lastVerifiedAt: undefined, verificationStatus: undefined });
      return id;
    });
    const asAdmin = t.withIdentity(adminIdentity);
    await expect(asAdmin.mutation(api.partnerAdmin.setGrantPartnerFields, { grantId, partnerVisible: true })).rejects.toThrow(
      /Verify the grant source/
    );
    await asAdmin.mutation(api.partnerAdmin.setGrantPartnerFields, {
      grantId,
      partnerVisible: true,
      markVerifiedNow: true,
    });
    const grant = await t.run((ctx) => ctx.db.get("grants", grantId));
    expect(grant).toMatchObject({ partnerVisible: true, verificationStatus: "verified" });
    expect(grant?.lastVerifiedAt).toBeTypeOf("number");
  });
});

describe("sandbox seed", () => {
  test("refuses to run unless the deployment is marked as sandbox", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(internal.partnerAdmin.seedSandbox, {})).rejects.toThrow(/PARTNER_SANDBOX_DEPLOYMENT/);
  });

  test("seeds test grants and a working sandbox key", async () => {
    vi.stubEnv("PARTNER_SANDBOX_DEPLOYMENT", "true");
    const t = convexTest(schema, modules);
    const res = await t.mutation(internal.partnerAdmin.seedSandbox, {});
    expect(res.createdGrants).toBe(4);
    expect(res.apiKey).toMatch(/^fp_test_/);
    const auth = await t.mutation(internal.partnerApi.beginRequest, {
      keyHash: await hashPartnerApiKey(res.apiKey),
      environment: "sandbox",
    });
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    const list = await t.query(internal.partnerApi.listGrants, {
      partnerId: auth.partner.id,
      filters: { region: "Jizzakh" },
      sort: "deadline_asc",
      page: 1,
      limit: 10,
    });
    expect(list.data.length).toBeGreaterThan(0);
    expect(list.data[0].flags.deadline_soon).toBe(true);
  });
});

describe("public catalog hardening", () => {
  test("direct Convex catalog access can be switched off; server queries keep working", async () => {
    const { t, publicGrantId } = await setup();
    const rawId = publicGrantId.slice("grant_".length);

    const open = await t.query(api.grants.list, { page: 1, limit: 500 });
    expect(open.limit).toBe(50);

    vi.stubEnv("PUBLIC_CATALOG_QUERIES_DISABLED", "true");
    await expect(t.query(api.grants.list, { page: 1, limit: 10 })).rejects.toThrow(/disabled/);
    await expect(t.query(api.grants.getById, { id: rawId })).rejects.toThrow(/disabled/);

    const server = await t.query(internal.grants.listForServer, { page: 1, limit: 10 });
    expect(server.total).toBeGreaterThan(0);
    expect(await t.query(internal.grants.getByIdForServer, { id: rawId })).not.toBeNull();
  });
});
