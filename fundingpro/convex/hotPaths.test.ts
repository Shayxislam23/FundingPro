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

describe("subscription lifecycle", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  async function seedSubscriptionWithPayment(
    ctx: MutationCtx,
    userId: Id<"users">,
    overrides: { status?: string; endDate?: number } = {}
  ) {
    const now = Date.now();
    const planId = await ctx.db.insert("plans", {
      slug: `plan-test-${now}-${Math.random()}`,
      name: "Basic",
      targetType: "NGO",
      priceUsd: 30,
      billingPeriod: "monthly",
      features: ["test"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId,
      planId,
      status: overrides.status ?? "PENDING",
      endDate: overrides.endDate,
      createdAt: now,
      updatedAt: now,
    });
    const paymentId = await ctx.db.insert("payments", {
      userId,
      subscriptionId,
      amountUsd: 30,
      currency: "UZS",
      status: "PENDING",
      provider: "payme",
      idempotencyKey: `sub-${now}-${Math.random()}`,
      serviceType: "subscription",
      createdAt: now,
      updatedAt: now,
    });
    return { planId, subscriptionId, paymentId };
  }

  test("activateSubscription sets endDate one billing period ahead", async () => {
    const t = convexTest(schema, modules);
    let subscriptionId = "" as Id<"subscriptions">;
    let paymentId = "" as Id<"payments">;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, `sub|${Date.now()}`, `clerk-sub-${Date.now()}`);
      const seeded = await seedSubscriptionWithPayment(ctx, userId);
      subscriptionId = seeded.subscriptionId;
      paymentId = seeded.paymentId;
    });

    const before = Date.now();
    await t.mutation(internal.paymentsInternal.activateSubscription, { paymentId });

    const subscription = await t.run(async (ctx) => ctx.db.get("subscriptions", subscriptionId));
    expect(subscription?.status).toBe("ACTIVE");
    expect(subscription?.endDate).toBeGreaterThanOrEqual(before + 30 * DAY_MS);
    expect(subscription?.endDate).toBeLessThan(before + 31 * DAY_MS);
  });

  test("renewal payment extends endDate instead of resetting it", async () => {
    const t = convexTest(schema, modules);
    const futureEnd = Date.now() + 10 * DAY_MS;
    let subscriptionId = "" as Id<"subscriptions">;
    let paymentId = "" as Id<"payments">;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, `sub-renew|${Date.now()}`, `clerk-sub-renew-${Date.now()}`);
      const seeded = await seedSubscriptionWithPayment(ctx, userId, {
        status: "ACTIVE",
        endDate: futureEnd,
      });
      subscriptionId = seeded.subscriptionId;
      paymentId = seeded.paymentId;
    });

    await t.mutation(internal.paymentsInternal.activateSubscription, { paymentId });

    const subscription = await t.run(async (ctx) => ctx.db.get("subscriptions", subscriptionId));
    expect(subscription?.endDate).toBeGreaterThanOrEqual(futureEnd + 30 * DAY_MS);
  });

  test("expireSubscriptions flips overdue ACTIVE rows and skips legacy rows without endDate", async () => {
    const t = convexTest(schema, modules);
    let overdueId = "" as Id<"subscriptions">;
    let currentId = "" as Id<"subscriptions">;
    let legacyId = "" as Id<"subscriptions">;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, `sub-exp|${Date.now()}`, `clerk-sub-exp-${Date.now()}`);
      overdueId = (
        await seedSubscriptionWithPayment(ctx, userId, {
          status: "ACTIVE",
          endDate: Date.now() - DAY_MS,
        })
      ).subscriptionId;
      currentId = (
        await seedSubscriptionWithPayment(ctx, userId, {
          status: "ACTIVE",
          endDate: Date.now() + DAY_MS,
        })
      ).subscriptionId;
      legacyId = (
        await seedSubscriptionWithPayment(ctx, userId, { status: "ACTIVE" })
      ).subscriptionId;
    });

    const result = await t.mutation(internal.paymentsInternal.expireSubscriptions, {});
    expect(result.expired).toBe(1);

    const [overdue, current, legacy] = await t.run(async (ctx) =>
      Promise.all([
        ctx.db.get("subscriptions", overdueId),
        ctx.db.get("subscriptions", currentId),
        ctx.db.get("subscriptions", legacyId),
      ])
    );
    expect(overdue?.status).toBe("EXPIRED");
    expect(current?.status).toBe("ACTIVE");
    expect(legacy?.status).toBe("ACTIVE");
  });

  test("users.getSubscription hides ACTIVE rows past endDate before cron runs", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `sub-hide|${Date.now()}`;
    const clerkId = `clerk-sub-hide-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      await seedSubscriptionWithPayment(ctx, userId, {
        status: "ACTIVE",
        endDate: Date.now() - DAY_MS,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const subscription = await authed.query(api.users.getSubscription, {});
    expect(subscription).toBeNull();
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

describe("support.listForUser", () => {
  test("returns paginated tickets for the authenticated user", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `support|${Date.now()}`;
    const clerkId = `clerk-support-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      const now = Date.now();
      await ctx.db.insert("supportTickets", {
        userId,
        subject: "Billing question",
        message: "Need help",
        status: "OPEN",
        priority: "LOW",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const result = await authed.query(api.support.listForUser, { page: 1, limit: 10 });
    expect(result.tickets.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.tickets[0]?.subject).toBe("Billing question");
  });
});

describe("proposals paginated lists", () => {
  test("listProjects returns user projects with limit", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `proposals|${Date.now()}`;
    const clerkId = `clerk-proposals-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      const now = Date.now();
      await ctx.db.insert("proposalProjects", {
        userId,
        title: "Water project",
        donorFormat: "un",
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const projects = await authed.query(api.proposals.listProjects, { limit: 5 });
    expect(projects.length).toBe(1);
    expect(projects[0]?.title).toBe("Water project");
  });

  test("listAiLogs returns paginated admin logs", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin-ai|${Date.now()}`;
    const clerkId = `clerk-admin-ai-${Date.now()}`;

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      const memberUser = await seedUser(ctx, `member-ai|${Date.now()}`, `member-ai-${Date.now()}`);
      await ctx.db.insert("aiRequests", {
        userId: memberUser,
        requestType: "proposal",
        model: "gpt-4o-mini",
        inputTokens: 10,
        outputTokens: 20,
        hasPersonalData: false,
        redactionApplied: true,
        status: "SUCCESS",
        createdAt: Date.now(),
      });
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const result = await authedAdmin.query(api.proposals.listAiLogs, { page: 1, limit: 10 });
    expect(result.logs.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });
});

describe("consents user queries", () => {
  test("listForUser and hasCurrent reflect recorded consents", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `consent|${Date.now()}`;
    const clerkId = `clerk-consent-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      const now = Date.now();
      for (const consentType of ["terms_of_service", "privacy_policy", "ai_disclosure"]) {
        await ctx.db.insert("userConsents", {
          userId,
          consentType,
          documentVersion: "2025-01",
          createdAt: now,
        });
      }
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const listed = await authed.query(api.consents.listForUser, {});
    expect(listed.length).toBe(3);

    const current = await authed.query(api.consents.hasCurrent, {});
    expect(current.ok).toBe(true);
    expect(current.missing).toEqual([]);
  });
});

describe("applications.list", () => {
  test("returns paginated user applications", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `apps-list|${Date.now()}`;
    const clerkId = `clerk-apps-list-${Date.now()}`;
    let grantId = "" as Id<"grants">;

    await t.run(async (ctx) => {
      const seeded = await seedCatalog(ctx);
      grantId = seeded.grantId;
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      await ctx.db.insert("applications", {
        userId,
        grantId,
        status: "SAVED",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const result = await authed.query(api.applications.list, { page: 1, limit: 10 });
    expect(result.applications.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.applications[0]?.grant?.id).toBe(grantId);
  });
});

describe("onboarding.getStatus", () => {
  test("marks steps complete from first matching records", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `onboard|${Date.now()}`;
    const clerkId = `clerk-onboard-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      const now = Date.now();
      const orgId = await ctx.db.insert("organizations", {
        name: "Test NGO",
        type: "NGO",
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("organizationMembers", {
        userId,
        organizationId: orgId,
        role: "owner",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("documents", {
        userId,
        fileName: "charter.pdf",
        storageKey: "charter.pdf",
        docType: "CHARTER",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const status = await authed.query(api.onboarding.getStatus, {});
    expect(status.steps.profile).toBe(true);
    expect(status.steps.documents).toBe(true);
    expect(status.completedCount).toBeGreaterThanOrEqual(2);
  });
});

describe("adminGrants admin lists", () => {
  test("listDonors and listRequirements use paginated reads", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin-grants|${Date.now()}`;
    const clerkId = `clerk-admin-grants-${Date.now()}`;
    let grantId = "" as Id<"grants">;

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      const seeded = await seedCatalog(ctx);
      grantId = seeded.grantId;
      await ctx.db.insert("grantRequirements", {
        grantId,
        requirementType: "general",
        text: "Must be registered NGO",
        required: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const donors = await authedAdmin.query(api.adminGrants.listDonors, {});
    expect(donors.length).toBeGreaterThanOrEqual(1);

    const requirements = await authedAdmin.query(api.adminGrants.listRequirements, {
      grantId,
    });
    expect(requirements.length).toBe(1);
    expect(requirements[0]?.text).toBe("Must be registered NGO");
  });
});
