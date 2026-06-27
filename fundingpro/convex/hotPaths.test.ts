/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

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

async function seedUser(ctx: MutationCtx, tokenIdentifier: string, clerkId: string) {
  const now = Date.now();
  return await ctx.db.insert("users", {
    clerkId,
    tokenIdentifier,
    email: `${clerkId}@test.local`,
    emailVerified: true,
    isActive: true,
    isBanned: false,
    platformRole: "user",
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
