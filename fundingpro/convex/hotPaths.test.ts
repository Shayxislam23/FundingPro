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

describe("matchGrants.match", () => {
  test("scores profile matches without scanning the whole catalog", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `match|${Date.now()}`;
    const clerkId = `clerk-match-${Date.now()}`;
    let climateGrantId = "" as Id<"grants">;

    await t.run(async (ctx) => {
      const seeded = await seedCatalog(ctx);
      climateGrantId = seeded.grantId;
      await seedUser(ctx, tokenIdentifier, clerkId);

      await ctx.db.insert("grants", {
        title: "Business Expansion Grant",
        description: "A less relevant test grant",
        donorId: seeded.donorId,
        sectors: ["business"],
        countryScope: ["Kazakhstan"],
        applicantTypes: ["Business"],
        currency: "USD",
        status: "open",
        isActive: true,
        isFeatured: true,
        lastUpdatedAt: seeded.now,
        createdAt: seeded.now,
        updatedAt: seeded.now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const result = await authed.query(api.matchGrants.match, {
      profile: {
        sector: "Climate",
        country: "uzbekistan",
        applicantType: "ngo",
      },
      limit: 5,
    });

    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[0]?.grantId).toBe(climateGrantId);
    expect(result[0]?.score).toBe(100);
    expect(result[0]?.reasons).toContain("Совпадение по сектору");
    expect(result[0]?.reasons).toContain("Совпадение по стране");
    expect(result[0]?.reasons).toContain("Совпадение по типу заявителя");
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
describe("payments.adminReport reconciliation", () => {
  test("flags provider-paid Payme transactions that are not locally successful", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin-payments|${Date.now()}`;
    const clerkId = `clerk-admin-payments-${Date.now()}`;
    let paymentId = "" as Id<"payments">;

    await t.run(async (ctx) => {
      const adminUserId = await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      paymentId = await ctx.db.insert("payments", {
        userId: adminUserId,
        amountUsd: 99,
        currency: "UZS",
        status: "PENDING",
        provider: "payme",
        idempotencyKey: `payme-reconcile-${Date.now()}`,
        serviceType: "subscription",
        metadata: { planId: "pro", planName: "Pro", amountTiyin: 149_000_000 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("paymeTransactions", {
        paymeTransId: `payme-reconcile-tx-${Date.now()}`,
        paymentId,
        state: 2,
        amountTiyin: 149_000_000,
        createTime: Date.now(),
        performTime: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const admin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const report = await admin.query(api.payments.adminReport, { provider: "payme" });

    expect(report.reconciliation.openIssues).toBe(1);
    expect(report.reconciliation.criticalIssues).toBe(1);
    expect(report.reconciliation.issues[0]?.paymentId).toBe(paymentId);
    expect(report.reconciliation.issues[0]?.code).toBe("provider_paid_local_not_success");
  });
});

describe("lab access nextAction", () => {
  test("guides user from enrollment to payment review to lab access", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `lab-action|${Date.now()}`;
    const clerkId = `clerk-lab-action-${Date.now()}`;
    let enrollmentId = "" as Id<"labEnrollments">;

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId);
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const emptyAccess = await authed.query(api.lab.getMyAccess, {});
    expect(emptyAccess.accessState).toBe("not_enrolled");
    expect(emptyAccess.nextAction.kind).toBe("enroll");

    const reserved = await authed.mutation(api.lab.ensureMyEnrollment, {});
    expect(reserved.accessState).toBe("pending_payment");
    expect(reserved.nextAction.kind).toBe("pay");
    enrollmentId = reserved.enrollment?.id as Id<"labEnrollments">;

    await t.run(async (ctx) => {
      await ctx.db.patch(enrollmentId, {
        status: "manual_review",
        updatedAt: Date.now(),
      });
    });
    const manualReview = await authed.query(api.lab.getMyAccess, {});
    expect(manualReview.nextAction.kind).toBe("await_manual_review");

    await t.run(async (ctx) => {
      await ctx.db.patch(enrollmentId, {
        status: "paid",
        paidAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    const paid = await authed.query(api.lab.getMyAccess, {});
    expect(paid.hasPaidAccess).toBe(true);
    expect(paid.nextAction.kind).toBe("open_lab");
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
      await ctx.db.insert("labParticipants", {
        userId,
        fullName: "Test User",
        createdAt: now,
        updatedAt: now,
      });
      const documentId = await ctx.db.insert("documents", {
        userId,
        fileName: "cv.pdf",
        storageKey: "cv.pdf",
        docType: "CV",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labTasks", {
        userId,
        taskType: "cv",
        studentStatus: "submitted",
        mentorStatus: "approved",
        evidenceDocumentId: documentId,
        submittedAt: now,
        reviewedAt: now,
        reviewedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const status = await authed.query(api.onboarding.getStatus, {});
    expect(status.steps.profile).toBe(true);
    expect(status.steps.cv).toBe(true);
    expect(status.completedCount).toBeGreaterThanOrEqual(2);
  });

  test("requires mentor-approved opportunities and attendance for certificate eligibility", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `certificate|${Date.now()}`;
    const clerkId = `clerk-certificate-${Date.now()}`;
    const adminTokenIdentifier = `certificate-admin|${Date.now()}`;
    const adminClerkId = `clerk-certificate-admin-${Date.now()}`;
    let userId = "" as Id<"users">;

    await t.run(async (ctx) => {
      userId = await seedUser(ctx, tokenIdentifier, clerkId);
      await seedUser(ctx, adminTokenIdentifier, adminClerkId, "admin");
      const now = Date.now();
      await ctx.db.insert("labParticipants", {
        userId,
        fullName: "Certificate Student",
        linkedinUrl: "https://linkedin.com/in/certificate-student",
        selectedOpportunityCount: 10,
        createdAt: now,
        updatedAt: now,
      });

      for (const taskType of ["cv", "motivation_letter", "proof_uploaded", "application_submitted"] as const) {
        await ctx.db.insert("labTasks", {
          userId,
          taskType,
          studentStatus: "submitted",
          mentorStatus: "approved",
          submittedAt: now,
          reviewedAt: now,
          reviewedBy: userId,
          createdAt: now,
          updatedAt: now,
        });
      }

      await ctx.db.insert("labOpportunityApplications", {
        userId,
        title: "Verified opportunity",
        submissionMethod: "external_portal",
        status: "approved",
        reviewedAt: now,
        reviewedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const before = await authed.query(api.onboarding.getStatus, {});
    expect(before.steps.opportunities_10).toBe(false);
    expect(before.steps.application_submitted).toBe(true);
    expect(before.certificateEligible).toBe(false);

    const authedAdmin = t.withIdentity({
      tokenIdentifier: adminTokenIdentifier,
      subject: adminClerkId,
    });
    const blockedDecision = await authedAdmin.mutation(api.onboarding.issueCertificateDecision, {
      userId: clerkId,
    });
    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockedReasons).toContain("opportunities_10_not_approved");
    expect(blockedDecision.blockedReasons).toContain("attendance_below_70");

    await t.run(async (ctx) => {
      const now = Date.now();
      const participant = await ctx.db
        .query("labParticipants")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      expect(participant).not.toBeNull();
      await ctx.db.patch(participant!._id, {
        attendancePercent: 70,
        updatedAt: now,
      });
      await ctx.db.insert("labTasks", {
        userId,
        taskType: "opportunities_10",
        studentStatus: "submitted",
        mentorStatus: "approved",
        submittedAt: now,
        reviewedAt: now,
        reviewedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    });

    const after = await authed.query(api.onboarding.getStatus, {});
    expect(after.certificateEligible).toBe(true);

    const issuedDecision = await authedAdmin.mutation(api.onboarding.issueCertificateDecision, {
      userId: clerkId,
    });
    expect(issuedDecision.status).toBe("issued");
    expect(issuedDecision.blockedReasons).toEqual([]);
  });

  test("recomputes cohort stats from enrollments and participant review state", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `stats-user|${Date.now()}`;
    const clerkId = `clerk-stats-user-${Date.now()}`;
    const adminTokenIdentifier = `stats-admin|${Date.now()}`;
    const adminClerkId = `clerk-stats-admin-${Date.now()}`;

    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, tokenIdentifier, clerkId);
      await seedUser(ctx, adminTokenIdentifier, adminClerkId, "admin");
      const now = Date.now();
      const cohortId = await ctx.db.insert("labCohorts", {
        slug: "stats-cohort",
        name: "Stats Cohort",
        startsAt: now,
        priceUzs: 150_000,
        status: "enrolling",
        certificatePolicyVersion: "lab-v1",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labEnrollments", {
        userId,
        cohortId,
        status: "paid",
        amountUzs: 150_000,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labParticipants", {
        userId,
        fullName: "Stats User",
        participantStatus: "needs_reminder",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labTasks", {
        userId,
        taskType: "cv",
        studentStatus: "submitted",
        mentorStatus: "pending_review",
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    const authedAdmin = t.withIdentity({
      tokenIdentifier: adminTokenIdentifier,
      subject: adminClerkId,
    });
    const stats = await authedAdmin.mutation(api.onboarding.recomputeCohortStatsForAdmin, {
      cohortSlug: "stats-cohort",
    });

    expect(stats.totalEnrollments).toBe(1);
    expect(stats.paidEnrollments).toBe(1);
    expect(stats.totalParticipants).toBe(1);
    expect(stats.needsMentorReview).toBe(1);
    expect(stats.needsReminder).toBe(1);
    expect(stats.collectedUzs).toBe(150_000);

    const listed = await authedAdmin.query(api.onboarding.listParticipantsForAdmin, {
      limit: 10,
      cohortSlug: "stats-cohort",
    });
    expect(listed.cohortStats?.paidEnrollments).toBe(1);
  });

  test("listJourneyForAdmin returns enrolled lab users only", async () => {
    const t = convexTest(schema, modules);
    const enrolledToken = `journey-enrolled|${Date.now()}`;
    const enrolledClerk = `clerk-journey-enrolled-${Date.now()}`;
    const otherToken = `journey-other|${Date.now()}`;
    const otherClerk = `clerk-journey-other-${Date.now()}`;
    const adminToken = `journey-admin|${Date.now()}`;
    const adminClerk = `clerk-journey-admin-${Date.now()}`;

    await t.run(async (ctx) => {
      const enrolledUserId = await seedUser(ctx, enrolledToken, enrolledClerk);
      await seedUser(ctx, otherToken, otherClerk);
      await seedUser(ctx, adminToken, adminClerk, "admin");
      const now = Date.now();
      const cohortId = await ctx.db.insert("labCohorts", {
        slug: "journey-cohort",
        name: "Journey Cohort",
        startsAt: now,
        priceUzs: 150_000,
        status: "enrolling",
        certificatePolicyVersion: "lab-v1",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labEnrollments", {
        userId: enrolledUserId,
        cohortId,
        status: "paid",
        amountUzs: 150_000,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("labParticipants", {
        userId: enrolledUserId,
        fullName: "Enrolled Student",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier: adminToken, subject: adminClerk });
    const journey = await authedAdmin.query(api.onboarding.listJourneyForAdmin, { limit: 10 });
    expect(journey.participants).toHaveLength(1);
    expect(journey.participants[0]?.fullName).toBe("Enrolled Student");
    expect(journey.participants[0]?.email).toBe(`${enrolledClerk}@test.local`);
  });
});

describe("adminGrants.bulkImport", () => {
  test("inserts new grants, reuses donors, dedupes by sourceUrl and title", async () => {
    const t = convexTest(schema, modules);
    const tokenIdentifier = `admin-import|${Date.now()}`;
    const clerkId = `clerk-admin-import-${Date.now()}`;

    await t.run(async (ctx) => {
      await seedUser(ctx, tokenIdentifier, clerkId, "admin");
      await seedCatalog(ctx); // seeds donor "Test Donor" + grant "Climate Adaptation Grant"
    });

    const authedAdmin = t.withIdentity({ tokenIdentifier, subject: clerkId });
    const result = await authedAdmin.mutation(api.adminGrants.bulkImport, {
      grants: [
        {
          title: "New Water Grant",
          donorName: "Test Donor",
          sectors: ["water"],
          countryScope: ["Uzbekistan"],
          sourceUrl: "https://example.org/water",
        },
        // duplicate sourceUrl of the row above
        {
          title: "Water Grant Copy",
          donorName: "Test Donor",
          sourceUrl: "https://example.org/water",
        },
        // duplicate title within the same donor (case-insensitive)
        { title: "climate adaptation grant", donorName: "Test Donor" },
        // new donor should be created on the fly
        { title: "Fresh Donor Grant", donorName: "Brand New Fund" },
      ],
    });

    expect(result.inserted).toBe(2);
    expect(result.skipped).toBe(2);
    expect(result.skippedItems.map((s) => s.reason).sort()).toEqual([
      "duplicate_source_url",
      "duplicate_title",
    ]);

    const donors = await t.run(async (ctx) => ctx.db.query("donors").collect());
    expect(donors.some((d) => d.name === "Brand New Fund")).toBe(true);
  });
});

describe("adminGrants.closeExpiredGrants", () => {
  test("closes active grants past deadline, keeps future and closed ones", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let expiredId = "" as Id<"grants">;
    let futureId = "" as Id<"grants">;

    await t.run(async (ctx) => {
      const { donorId } = await seedCatalog(ctx);
      const base = {
        donorId,
        sectors: [] as string[],
        countryScope: [] as string[],
        applicantTypes: [] as string[],
        currency: "USD",
        isFeatured: false,
        lastUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      expiredId = await ctx.db.insert("grants", {
        ...base,
        title: "Expired grant",
        status: "open",
        isActive: true,
        deadline: now - DAY,
      });
      futureId = await ctx.db.insert("grants", {
        ...base,
        title: "Future grant",
        status: "open",
        isActive: true,
        deadline: now + DAY,
      });
      await ctx.db.insert("grants", {
        ...base,
        title: "Already closed grant",
        status: "closed",
        isActive: false,
        deadline: now - 2 * DAY,
      });
    });

    const result = await t.mutation(internal.adminGrants.closeExpiredGrants, {});
    expect(result.closed).toBe(1);

    const [expired, future] = await t.run(async (ctx) =>
      Promise.all([ctx.db.get("grants", expiredId), ctx.db.get("grants", futureId)])
    );
    expect(expired?.isActive).toBe(false);
    expect(expired?.status).toBe("closed");
    expect(future?.isActive).toBe(true);
    expect(future?.status).toBe("open");
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
