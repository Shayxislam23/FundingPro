/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { refreshPlatformStatsImpl } from "./platformStats";

const modules = import.meta.glob("./**/*.ts");

async function seedCatalog(ctx: MutationCtx) {
  const now = Date.now();
  const donorId = await ctx.db.insert("donors", {
    name: "Test Donor",
    nameRu: "Тест",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const grantId = await ctx.db.insert("grants", {
    title: "Climate Adaptation Grant",
    titleRu: "Грант адаптации",
    description: "Test grant for convex-test",
    donorId,
    sectors: ["climate"],
    countryScope: ["Uzbekistan"],
    applicantTypes: ["NGO"],
    currency: "USD",
    status: "open",
    isActive: true,
    isFeatured: false,
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { donorId, grantId, now };
}

async function seedUser(
  ctx: MutationCtx,
  tokenIdentifier: string,
  clerkId: string,
  platformRole: "user" | "admin" = "user"
) {
  const now = Date.now();
  return await ctx.db.insert("users", {
    clerkId,
    tokenIdentifier,
    email: `${clerkId}@test.local`,
    emailVerified: true,
    isActive: true,
    isBanned: false,
    platformRole,
    createdAt: now,
    updatedAt: now,
  });
}

describe("rateLimits.checkRateLimit", () => {
  test("allows requests until max then blocks", async () => {
    const t = convexTest(schema, modules);
    const key = `test-${Date.now()}`;

    const first = await t.mutation(internal.rateLimits.checkRateLimit, {
      key,
      maxRequests: 2,
      windowMs: 60_000,
    });
    expect(first.allowed).toBe(true);
    expect(first.count).toBe(1);

    const second = await t.mutation(internal.rateLimits.checkRateLimit, {
      key,
      maxRequests: 2,
      windowMs: 60_000,
    });
    expect(second.allowed).toBe(true);
    expect(second.count).toBe(2);

    const third = await t.mutation(internal.rateLimits.checkRateLimit, {
      key,
      maxRequests: 2,
      windowMs: 60_000,
    });
    expect(third.allowed).toBe(false);
    expect(third.count).toBe(2);
  });
});

describe("grants.list", () => {
  test("returns paginated catalog shape", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await seedCatalog(ctx);
    });

    const result = await t.query(api.grants.list, { page: 1, limit: 10 });
    expect(result.grants.length).toBeGreaterThanOrEqual(1);
    expect(typeof result.total).toBe("number");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  test("uses by_donor fast path when donorId is set", async () => {
    const t = convexTest(schema, modules);
    let donorId = "" as Id<"donors">;
    await t.run(async (ctx) => {
      const seeded = await seedCatalog(ctx);
      donorId = seeded.donorId;
    });

    const result = await t.query(api.grants.list, {
      donorId,
      page: 1,
      limit: 20,
    });
    expect(result.grants.every((g) => g.donor.id === donorId)).toBe(true);
  });
});

describe("applications.create", () => {
  test("creates application and deduplicates on same grant", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `test|app-${Date.now()}`;
    const clerkId = `clerk-app-${Date.now()}`;
    let grantId = "" as Id<"grants">;

    await t.run(async (ctx) => {
      const seeded = await seedCatalog(ctx);
      grantId = seeded.grantId;
      await seedUser(ctx, tokenIdentifier, clerkId);
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });

    const created = await authed.mutation(api.applications.create, {
      grantId,
      notes: "First save",
    });
    expect("applicationId" in created && created.alreadyExists).toBe(false);
    expect("applicationId" in created && created.status).toBe("SAVED");

    const duplicate = await authed.mutation(api.applications.create, {
      grantId,
    });
    expect("applicationId" in duplicate && duplicate.alreadyExists).toBe(true);
    expect("applicationId" in duplicate && duplicate.applicationId).toBe(
      "applicationId" in created ? created.applicationId : null
    );
  });
});

describe("paymentsInternal.insertEvent", () => {
  test("deduplicates repeated transId payloads", async () => {
    const t = convexTest(schema, modules);
    let paymentId = "" as Id<"payments">;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, `pay|${Date.now()}`, `clerk-pay-${Date.now()}`);
      paymentId = await ctx.db.insert("payments", {
        userId,
        amountUsd: 12,
        currency: "USD",
        status: "PENDING",
        provider: "uzum",
        idempotencyKey: `pay-${Date.now()}`,
        serviceType: "subscription",
        metadata: { planId: "starter", planName: "Starter", amountTiyin: 120_000 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(internal.paymentsInternal.insertEvent, {
      paymentId,
      eventType: "created",
      payload: { transId: "tx-1", status: "created" },
      source: "uzum",
    });
    await t.mutation(internal.paymentsInternal.insertEvent, {
      paymentId,
      eventType: "created",
      payload: { transId: "tx-1", status: "duplicate" },
      source: "uzum",
    });

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("paymentEvents")
        .withIndex("by_payment", (q) => q.eq("paymentId", paymentId))
        .collect()
    );
    expect(events.length).toBe(1);
  });

  test("stores unique events for different transId values", async () => {
    const t = convexTest(schema, modules);
    let paymentId = "" as Id<"payments">;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, `pay2|${Date.now()}`, `clerk-pay2-${Date.now()}`);
      paymentId = await ctx.db.insert("payments", {
        userId,
        amountUsd: 20,
        currency: "USD",
        status: "PENDING",
        provider: "uzum",
        idempotencyKey: `pay2-${Date.now()}`,
        serviceType: "subscription",
        metadata: { planId: "pro", planName: "Pro", amountTiyin: 200_000 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(internal.paymentsInternal.insertEvent, {
      paymentId,
      eventType: "created",
      payload: { transId: "tx-a", status: "created" },
      source: "uzum",
    });
    await t.mutation(internal.paymentsInternal.insertEvent, {
      paymentId,
      eventType: "created",
      payload: { transId: "tx-b", status: "created" },
      source: "uzum",
    });

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("paymentEvents")
        .withIndex("by_payment", (q) => q.eq("paymentId", paymentId))
        .collect()
    );
    expect(events.length).toBe(2);
  });
});

describe("adminStats.dashboard", () => {
  test("reads refreshed platform stats for admin dashboard", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin|${Date.now()}`;
    const clerkId = `clerk-admin-${Date.now()}`;

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      const { grantId } = await seedCatalog(ctx);
      const memberUser = await seedUser(ctx, `member|${Date.now()}`, `member-${Date.now()}`);

      await ctx.db.insert("applications", {
        userId: memberUser,
        grantId,
        status: "SAVED",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("supportTickets", {
        userId: memberUser,
        subject: "Help",
        message: "Need assistance",
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("aiRequests", {
        userId: memberUser,
        requestType: "eligibility",
        model: "gpt-4o-mini",
        inputTokens: 12,
        outputTokens: 9,
        hasPersonalData: false,
        redactionApplied: true,
        status: "SUCCESS",
        createdAt: Date.now(),
      });
      await refreshPlatformStatsImpl(ctx);
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const dashboard = await authedAdmin.query(api.adminStats.dashboard, {
      monthStart: Date.now() - 86_400_000,
    });

    expect(dashboard.totalUsers).toBeGreaterThanOrEqual(2);
    expect(dashboard.totalApplications).toBeGreaterThanOrEqual(1);
    expect(dashboard.aiRequestsThisMonth).toBeGreaterThanOrEqual(1);
    expect(dashboard.recentUsers.length).toBeLessThanOrEqual(5);
  });

  test("computes funnel for last 30 days signups", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin-funnel|${Date.now()}`;
    const clerkId = `clerk-admin-funnel-${Date.now()}`;
    const now = Date.now();

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      const { grantId } = await seedCatalog(ctx);
      const recentUser = await seedUser(ctx, `recent|${Date.now()}`, `recent-${Date.now()}`);
      await ctx.db.insert("applications", {
        userId: recentUser,
        grantId,
        status: "SAVED",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const funnel = await authedAdmin.query(api.adminStats.funnel, {
      last30DaysSignups: true,
      now,
    });
    expect(funnel.signups).toBeGreaterThanOrEqual(1);
    expect(funnel.withApplication).toBeGreaterThanOrEqual(1);
  });
});
