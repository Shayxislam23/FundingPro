/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { MutationCtx } from "./_generated/server";

const modules = import.meta.glob("./**/*.ts");
const DAY = 24 * 60 * 60 * 1000;

async function seedUser(ctx: MutationCtx, role: "admin" | "user") {
  const now = Date.now();
  return ctx.db.insert("users", {
    clerkId: `clerk_${role}`,
    tokenIdentifier: `token:${role}`,
    email: `${role}@test.local`,
    emailVerified: true,
    isActive: true,
    isBanned: false,
    platformRole: role,
    createdAt: now,
    updatedAt: now,
  });
}

const base = {
  fullName: "Ali Valiyev",
  phone: "+998901234567",
  applicantType: "business",
  region: "Джизакская область",
  consentTextVersion: "v1.0",
};

describe("service requests", () => {
  test("creates a request and merges a repeat from the same phone within 24h", async () => {
    const t = convexTest(schema, modules);
    const a = await t.mutation(internal.serviceRequests.create, { ...base, message: "first" });
    const b = await t.mutation(internal.serviceRequests.create, { ...base, message: "second" });
    expect(a.duplicate).toBe(false);
    expect(b).toEqual({ id: a.id, duplicate: true });
    const rows = await t.run((ctx) => ctx.db.query("serviceRequests").take(10));
    expect(rows).toHaveLength(1);
    expect(rows[0].contactCount).toBe(2);
    expect(rows[0].message).toContain("second");
  });

  test("requires phone or email", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.serviceRequests.create, { ...base, phone: undefined })
    ).rejects.toThrow(/phone or email/);
  });

  test("only admins can list and update", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await seedUser(ctx, "admin");
      await seedUser(ctx, "user");
    });
    const { id } = await t.mutation(internal.serviceRequests.create, base);
    const asUser = t.withIdentity({ tokenIdentifier: "token:user", subject: "clerk_user" });
    await expect(asUser.query(api.serviceRequests.list, {})).rejects.toThrow();

    const asAdmin = t.withIdentity({ tokenIdentifier: "token:admin", subject: "clerk_admin" });
    await asAdmin.mutation(api.serviceRequests.update, { id: id as never, status: "won", notes: "10 млн сум" });
    const won = await asAdmin.query(api.serviceRequests.list, { status: "won" });
    expect(won).toHaveLength(1);
    expect(won[0]).toMatchObject({ fullName: "Ali Valiyev", notes: "10 млн сум" });
  });

  test("anonymizes stale requests after 12 months but keeps clients", async () => {
    const t = convexTest(schema, modules);
    const lost = await t.mutation(internal.serviceRequests.create, base);
    const won = await t.mutation(internal.serviceRequests.create, { ...base, phone: "+998907777777" });
    await t.run(async (ctx) => {
      const old = Date.now() - 400 * DAY;
      await ctx.db.patch("serviceRequests", lost.id as never, { createdAt: old, updatedAt: old });
      await ctx.db.patch("serviceRequests", won.id as never, { createdAt: old, updatedAt: old, status: "won" });
    });
    const res = await t.mutation(internal.serviceRequests.purgeExpired, {});
    expect(res.anonymized).toBe(1);
    const rows = await t.run((ctx) => ctx.db.query("serviceRequests").take(10));
    expect(rows.find((r) => r.status === "won")?.fullName).toBe("Ali Valiyev");
    expect(rows.find((r) => r.status !== "won")?.phone).toBeUndefined();
  });
});

describe("public catalog audience filter", () => {
  test("filters grants by applicant type", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const now = Date.now();
      const donorId = await ctx.db.insert("donors", { name: "D", isActive: true, createdAt: now, updatedAt: now });
      const mk = (title: string, applicantTypes: string[]) =>
        ctx.db.insert("grants", {
          title,
          donorId,
          sectors: [],
          countryScope: ["Uzbekistan"],
          applicantTypes,
          currency: "USD",
          deadline: now + 30 * DAY,
          status: "open",
          isActive: true,
          isFeatured: false,
          lastUpdatedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      await mk("For SMEs", ["Business"]);
      await mk("For NGOs", ["NGO"]);
      await mk("For youth", ["Individual"]);
    });
    const business = await t.query(api.grants.list, { applicantType: "business", page: 1, limit: 10 });
    expect(business.grants.map((g) => g.title)).toEqual(["For SMEs"]);
    const youth = await t.query(api.grants.list, { applicantType: "individual", page: 1, limit: 10 });
    expect(youth.grants.map((g) => g.title)).toEqual(["For youth"]);
    const all = await t.query(api.grants.list, { page: 1, limit: 10 });
    expect(all.total).toBe(3);
  });
});
