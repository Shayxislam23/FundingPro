/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import type { MutationCtx } from "./_generated/server";

const modules = import.meta.glob("./**/*.ts");

const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

async function seedDeletionRequestedUser(
  ctx: MutationCtx,
  clerkId: string,
  deletionRequestedAt: number
) {
  const now = Date.now();
  return await ctx.db.insert("users", {
    clerkId,
    tokenIdentifier: `token:${clerkId}`,
    email: `${clerkId}@test.local`,
    emailVerified: true,
    isActive: false,
    isBanned: false,
    platformRole: "user",
    deletionRequestedAt,
    createdAt: now,
    updatedAt: now,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("accountErasure.listPurgeCandidates", () => {
  test("only returns users past the 30-day grace period", async () => {
    const t = convexTest(schema, modules);
    const overdueId = await t.run((ctx) =>
      seedDeletionRequestedUser(ctx, "clerk_overdue", Date.now() - GRACE_PERIOD_MS - 1000)
    );
    await t.run((ctx) => seedDeletionRequestedUser(ctx, "clerk_recent", Date.now() - 1000));

    const candidates = await t.query(internal.accountErasure.listPurgeCandidates, {});

    expect(candidates).toEqual([{ userId: overdueId, clerkId: "clerk_overdue" }]);
  });

  test("excludes already-purged users", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const userId = await seedDeletionRequestedUser(
        ctx,
        "clerk_already_gone",
        Date.now() - GRACE_PERIOD_MS - 1000
      );
      await ctx.db.patch("users", userId, { deletedAt: Date.now() });
    });

    const candidates = await t.query(internal.accountErasure.listPurgeCandidates, {});

    expect(candidates).toEqual([]);
  });
});

describe("accountErasure.purgeUserRecord", () => {
  test("scrubs PII and cascades related data", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      const id = await seedDeletionRequestedUser(
        ctx,
        "clerk_to_purge",
        Date.now() - GRACE_PERIOD_MS - 1000
      );
      const donorId = await ctx.db.insert("donors", {
        name: "Test Donor",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const grantId = await ctx.db.insert("grants", {
        title: "Grant",
        donorId,
        sectors: [],
        countryScope: [],
        applicantTypes: [],
        currency: "USD",
        status: "open",
        isActive: true,
        isFeatured: false,
        lastUpdatedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("applications", {
        userId: id,
        grantId,
        status: "saved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    });

    await t.mutation(internal.accountErasure.purgeUserRecord, { userId });

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    const applications = await t.run((ctx) =>
      ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );

    expect(user?.deletedAt).toBeDefined();
    expect(user?.email).toBeUndefined();
    expect(user?.clerkId).toBe(`deleted_${userId}`);
    expect(applications).toEqual([]);
  });

  test("is a no-op if the user was never marked for deletion", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        clerkId: "clerk_active",
        tokenIdentifier: "token:clerk_active",
        email: "active@test.local",
        emailVerified: true,
        isActive: true,
        isBanned: false,
        platformRole: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );

    await t.mutation(internal.accountErasure.purgeUserRecord, { userId });

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.deletedAt).toBeUndefined();
    expect(user?.email).toBe("active@test.local");
  });
});

describe("accountErasure.purgeEligibleAccounts", () => {
  test("deletes the Clerk identity before purging Convex data", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      seedDeletionRequestedUser(ctx, "clerk_full_flow", Date.now() - GRACE_PERIOD_MS - 1000)
    );

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");

    const result = await t.action(internal.accountErasure.purgeEligibleAccounts, {});

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.clerk.com/v1/users/clerk_full_flow",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toEqual({
      processed: 1,
      purgedUserIds: [userId],
      clerkDeleted: 1,
      clerkSkipped: 0,
    });

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.deletedAt).toBeDefined();
  });

  test("leaves the user unpurged if the Clerk delete call fails", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      seedDeletionRequestedUser(ctx, "clerk_fails", Date.now() - GRACE_PERIOD_MS - 1000)
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");

    const result = await t.action(internal.accountErasure.purgeEligibleAccounts, {});

    expect(result).toEqual({ processed: 0, purgedUserIds: [], clerkDeleted: 0, clerkSkipped: 1 });

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.deletedAt).toBeUndefined();
  });

  test("treats an already-deleted Clerk user (404) as success and still purges", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      seedDeletionRequestedUser(ctx, "clerk_404", Date.now() - GRACE_PERIOD_MS - 1000)
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");

    const result = await t.action(internal.accountErasure.purgeEligibleAccounts, {});

    expect(result.processed).toBe(1);
    expect(result.clerkDeleted).toBe(1);
    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.deletedAt).toBeDefined();
  });
});
