/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const modules = import.meta.glob("./**/*.ts");
void internal;

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

async function seedGrant(ctx: MutationCtx, title: string) {
  const now = Date.now();
  const donorId = await ctx.db.insert("donors", {
    name: `Donor ${title}`,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return await ctx.db.insert("grants", {
    title,
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
}

function identity(tokenIdentifier: string, clerkId: string) {
  return { tokenIdentifier, subject: clerkId };
}

describe("labJourney", () => {
  test("fresh user has only registration done and profile as next step", async () => {
    const t = convexTest(schema, modules);
    const token = `lab|${Date.now()}`;
    const clerkId = `clerk-lab-${Date.now()}`;
    await t.run(async (ctx) => {
      await seedUser(ctx, token, clerkId);
    });

    const journey = await t.withIdentity(identity(token, clerkId)).query(api.labJourney.getMyJourney, {});
    expect(journey.progressPercent).toBe(10);
    expect(journey.nextStepId).toBe("profile");
    expect(journey.steps.find((s) => s.id === "registration")?.done).toBe(true);
    expect(journey.certificate.eligible).toBe(false);
  });

  test("profile, interests, linkedin and cv updates advance the journey", async () => {
    const t = convexTest(schema, modules);
    const token = `lab2|${Date.now()}`;
    const clerkId = `clerk-lab2-${Date.now()}`;
    await t.run(async (ctx) => {
      await seedUser(ctx, token, clerkId);
    });
    const authed = t.withIdentity(identity(token, clerkId));

    await authed.mutation(api.labJourney.updateMyProfile, {
      fullName: "Aisha Test",
      city: "Nukus",
      telegram: "@aisha",
      educationStatus: "student",
      interests: ["grants", "internships"],
      cvStatus: "help_requested",
      linkedinUrl: "https://linkedin.com/in/aisha",
    });

    const journey = await authed.query(api.labJourney.getMyJourney, {});
    const byId = new Map(journey.steps.map((s) => [s.id, s]));
    expect(byId.get("profile")?.state).toBe("completed");
    expect(byId.get("interests")?.state).toBe("completed");
    expect(byId.get("cv")?.state).toBe("in_progress");
    expect(byId.get("linkedin")?.state).toBe("completed");
    // registration + profile + interests + linkedin = 4/10
    expect(journey.progressPercent).toBe(40);
    expect(journey.nextStepId).toBe("cv");
  });

  test("10 saved grants complete the opportunities step", async () => {
    const t = convexTest(schema, modules);
    const token = `lab3|${Date.now()}`;
    const clerkId = `clerk-lab3-${Date.now()}`;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      for (let i = 0; i < 10; i += 1) {
        const grantId = await seedGrant(ctx, `Grant ${i}`);
        await ctx.db.insert("savedGrants", {
          userId,
          grantId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    const journey = await t.withIdentity(identity(token, clerkId)).query(api.labJourney.getMyJourney, {});
    expect(journey.savedGrantsCount).toBe(10);
    expect(journey.steps.find((s) => s.id === "opportunities")?.state).toBe("completed");
  });

  test("mentor needs_revision flags surface as step state", async () => {
    const t = convexTest(schema, modules);
    const token = `lab4|${Date.now()}`;
    const clerkId = `clerk-lab4-${Date.now()}`;
    const adminToken = `lab4a|${Date.now()}`;
    const adminClerk = `clerk-lab4a-${Date.now()}`;
    await t.run(async (ctx) => {
      await seedUser(ctx, token, clerkId);
      await seedUser(ctx, adminToken, adminClerk, "admin");
    });
    const authed = t.withIdentity(identity(token, clerkId));

    await authed.mutation(api.labJourney.updateMyProfile, { motivationLetterStatus: "submitted" });
    let journey = await authed.query(api.labJourney.getMyJourney, {});
    expect(journey.steps.find((s) => s.id === "motivation")?.state).toBe("submitted");
    expect(journey.steps.find((s) => s.id === "motivation")?.done).toBe(true);

    const participants = await t
      .withIdentity(identity(adminToken, adminClerk))
      .query(api.labJourney.adminList, {});
    const row = participants.find((r) => r.email === `${clerkId}@test.local`);
    expect(row).toBeDefined();

    await t.withIdentity(identity(adminToken, adminClerk)).mutation(api.labJourney.adminUpdate, {
      participantId: row!.id,
      motivationLetterStatus: "needs_revision",
      mentorStatus: "Needs reminder",
      mentorNotes: "Письмо слишком общее",
    });

    journey = await authed.query(api.labJourney.getMyJourney, {});
    const motivation = journey.steps.find((s) => s.id === "motivation");
    expect(motivation?.state).toBe("needs_revision");
    expect(motivation?.done).toBe(false);
  });

  test("certificate becomes eligible once all requirements incl. attendance are met", async () => {
    const t = convexTest(schema, modules);
    const token = `lab5|${Date.now()}`;
    const clerkId = `clerk-lab5-${Date.now()}`;
    const adminToken = `lab5a|${Date.now()}`;
    const adminClerk = `clerk-lab5a-${Date.now()}`;
    let grantId = "" as Id<"grants">;
    await t.run(async (ctx) => {
      const userId = await seedUser(ctx, token, clerkId);
      await seedUser(ctx, adminToken, adminClerk, "admin");
      for (let i = 0; i < 10; i += 1) {
        const g = await seedGrant(ctx, `Cert Grant ${i}`);
        if (i === 0) grantId = g;
        await ctx.db.insert("savedGrants", {
          userId,
          grantId: g,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      await ctx.db.insert("applications", {
        userId,
        grantId,
        status: "SUBMITTED",
        submittedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    const authed = t.withIdentity(identity(token, clerkId));

    await authed.mutation(api.labJourney.updateMyProfile, {
      fullName: "Bek Test",
      city: "Tashkent",
      telegram: "@bek",
      educationStatus: "graduate",
      interests: ["grants"],
      cvStatus: "uploaded",
      linkedinUrl: "https://linkedin.com/in/bek",
      motivationLetterStatus: "submitted",
      applicationProofStatus: "submitted",
    });

    let journey = await authed.query(api.labJourney.getMyJourney, {});
    expect(journey.progressPercent).toBe(100);
    // attendance is still pending — mentor has not confirmed it
    expect(journey.certificate.eligible).toBe(false);

    const admin = t.withIdentity(identity(adminToken, adminClerk));
    const rows = await admin.query(api.labJourney.adminList, {});
    const row = rows.find((r) => r.email === `${clerkId}@test.local`);
    await admin.mutation(api.labJourney.adminUpdate, {
      participantId: row!.id,
      attendanceOk: true,
    });

    journey = await authed.query(api.labJourney.getMyJourney, {});
    expect(journey.certificate.eligible).toBe(true);
  });

  test("adminList exposes mentor next-action hints", async () => {
    const t = convexTest(schema, modules);
    const token = `lab6|${Date.now()}`;
    const clerkId = `clerk-lab6-${Date.now()}`;
    const adminToken = `lab6a|${Date.now()}`;
    const adminClerk = `clerk-lab6a-${Date.now()}`;
    await t.run(async (ctx) => {
      await seedUser(ctx, token, clerkId);
      await seedUser(ctx, adminToken, adminClerk, "admin");
    });

    // participant row appears after the first profile touch
    await t.withIdentity(identity(token, clerkId)).mutation(api.labJourney.updateMyProfile, {
      telegram: "@newbie",
    });

    const rows = await t
      .withIdentity(identity(adminToken, adminClerk))
      .query(api.labJourney.adminList, {});
    const row = rows.find((r) => r.telegram === "@newbie");
    expect(row).toBeDefined();
    expect(row!.nextAction).toBe("Напомнить участнику заполнить профиль");
    expect(row!.certificateEligible).toBe(false);
  });
});
