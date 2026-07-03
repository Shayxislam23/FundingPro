/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(ctx: MutationCtx, tokenIdentifier: string, clerkId: string, role: "user" | "admin" = "user") {
  const now = Date.now();
  return await ctx.db.insert("users", {
    clerkId,
    tokenIdentifier,
    email: `${clerkId}@test.local`,
    emailVerified: true,
    isActive: true,
    isBanned: false,
    platformRole: role,
    createdAt: now,
    updatedAt: now,
  });
}

async function seedGrantAndApplication(ctx: MutationCtx, userId: Id<"users">) {
  const now = Date.now();
  const donorId = await ctx.db.insert("donors", {
    name: "Test Donor",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const grantId = await ctx.db.insert("grants", {
    title: "Business Grant",
    donorId,
    sectors: [],
    countryScope: [],
    applicantTypes: [],
    currency: "USD",
    status: "open",
    isActive: true,
    isFeatured: false,
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  const applicationId = await ctx.db.insert("applications", {
    userId,
    grantId,
    status: "shortlisted",
    createdAt: now,
    updatedAt: now,
  });
  return { grantId, applicationId };
}

function identity(tokenIdentifier: string, clerkId: string) {
  return { tokenIdentifier, subject: clerkId };
}

describe("successFee", () => {
  test("marking an application won with an amount creates a pending fee record", async () => {
    const t = convexTest(schema, modules);
    const token = `fee1|${Date.now()}`;
    const clerkId = `clerk-fee1-${Date.now()}`;
    let applicationId = "" as Id<"applications">;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      applicationId = (await seedGrantAndApplication(ctx, userId)).applicationId;
    });

    const authed = t.withIdentity(identity(token, clerkId));
    await authed.mutation(api.applications.update, {
      applicationId,
      status: "won",
      wonAmountUsd: 100_000,
    });

    const record = await authed.mutation(api.successFee.getMyRecord, { applicationId });
    expect(record).not.toBeNull();
    expect(record?.wonAmountUsd).toBe(100_000);
    expect(record?.feePercent).toBe(3); // seeded default via successFeePercent setting fallback
    expect(record?.feeAmountUsd).toBe(3_000);
    expect(record?.status).toBe("pending");
  });

  test("re-marking won with a new amount updates the record once, not duplicates it", async () => {
    const t = convexTest(schema, modules);
    const token = `fee2|${Date.now()}`;
    const clerkId = `clerk-fee2-${Date.now()}`;
    let applicationId = "" as Id<"applications">;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      applicationId = (await seedGrantAndApplication(ctx, userId)).applicationId;
    });

    const authed = t.withIdentity(identity(token, clerkId));
    await authed.mutation(api.applications.update, { applicationId, status: "won", wonAmountUsd: 50_000 });
    await authed.mutation(api.applications.update, { applicationId, status: "won", wonAmountUsd: 80_000 });

    const record = await authed.mutation(api.successFee.getMyRecord, { applicationId });
    expect(record?.wonAmountUsd).toBe(80_000);
    expect(record?.feeAmountUsd).toBe(2_400);

    const all = await t.run(async (ctx) => ctx.db.query("successFeeRecords").collect());
    const forThisApp = all.filter((r) => r.applicationId === applicationId);
    expect(forThisApp.length).toBe(1);
  });

  test("respects a custom successFeePercent setting", async () => {
    const t = convexTest(schema, modules);
    const token = `fee3|${Date.now()}`;
    const clerkId = `clerk-fee3-${Date.now()}`;
    let applicationId = "" as Id<"applications">;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      applicationId = (await seedGrantAndApplication(ctx, userId)).applicationId;
      const now = Date.now();
      await ctx.db.insert("settings", {
        key: "successFeePercent",
        value: "5",
        category: "billing",
        createdAt: now,
        updatedAt: now,
      });
    });

    const authed = t.withIdentity(identity(token, clerkId));
    await authed.mutation(api.applications.update, { applicationId, status: "won", wonAmountUsd: 10_000 });

    const record = await authed.mutation(api.successFee.getMyRecord, { applicationId });
    expect(record?.feePercent).toBe(5);
    expect(record?.feeAmountUsd).toBe(500);
  });

  test("amount is frozen once ops marks the record invoiced", async () => {
    const t = convexTest(schema, modules);
    const token = `fee4|${Date.now()}`;
    const clerkId = `clerk-fee4-${Date.now()}`;
    const adminToken = `fee4a|${Date.now()}`;
    const adminClerk = `clerk-fee4a-${Date.now()}`;
    let applicationId = "" as Id<"applications">;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      await seedUser(ctx, adminToken, adminClerk, "admin");
      applicationId = (await seedGrantAndApplication(ctx, userId)).applicationId;
    });

    const authed = t.withIdentity(identity(token, clerkId));
    await authed.mutation(api.applications.update, { applicationId, status: "won", wonAmountUsd: 20_000 });

    const admin = t.withIdentity(identity(adminToken, adminClerk));
    const rows = await admin.query(api.successFee.adminList, {});
    const row = rows.find((r) => r.wonAmountUsd === 20_000);
    expect(row).toBeDefined();

    await admin.mutation(api.successFee.adminUpdateStatus, {
      recordId: row!.id,
      status: "invoiced",
    });

    // user tries to "correct" the amount after invoicing — must not change
    await authed.mutation(api.applications.update, { applicationId, status: "won", wonAmountUsd: 999_999 });

    const record = await authed.mutation(api.successFee.getMyRecord, { applicationId });
    expect(record?.wonAmountUsd).toBe(20_000);
    expect(record?.status).toBe("invoiced");
  });
});
