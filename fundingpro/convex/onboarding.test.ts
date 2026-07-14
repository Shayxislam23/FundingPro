/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
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

function identity(tokenIdentifier: string, clerkId: string) {
  return { tokenIdentifier, subject: clerkId };
}

const REVIEWABLE_TASKS = [
  "cv",
  "opportunities_10",
  "motivation_letter",
  "chosen_opportunity",
  "application_submitted",
  "proof_uploaded",
] as const;

describe("onboarding.getStatus", () => {
  test("a brand new user starts at 1/10 steps (registration only) and is not certificate-eligible", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const status = await asStudent.query(api.onboarding.getStatus, {});

    expect(status.completedCount).toBe(1);
    expect(status.steps.registration).toBe(true);
    expect(status.steps.profile).toBe(false);
    expect(status.certificateEligible).toBe(false);
    expect(status.nextAction.title).toBe("Complete your profile");
  });
});

describe("onboarding.updateLabProfile", () => {
  test("saves profile fields and switches the account into individual mode", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const profile = await asStudent.mutation(api.onboarding.updateLabProfile, {
      fullName: "Dilnoza K.",
      linkedinUrl: "https://linkedin.com/in/dilnoza",
      interests: ["grants", "scholarships"],
    });

    expect(profile.fullName).toBe("Dilnoza K.");
    expect(profile.interests).toEqual(["grants", "scholarships"]);

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.userMode).toBe("individual");

    const status = await asStudent.query(api.onboarding.getStatus, {});
    expect(status.steps.profile).toBe(true);
    expect(status.steps.linkedin).toBe(true);
    expect(status.steps.interests).toBe(true);
  });
});

describe("onboarding.submitTask / reviewTask", () => {
  test("a task only counts toward the step once mentorStatus is approved, not merely submitted", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    const submitted = await asStudent.mutation(api.onboarding.submitTask, { taskType: "cv" });
    expect(submitted.mentorStatus).toBe("pending_review");

    let status = await asStudent.query(api.onboarding.getStatus, {});
    expect(status.steps.cv).toBe(false);
    expect(status.stepStates.cv).toBe("submitted");

    await asAdmin.mutation(api.onboarding.reviewTask, {
      userId: "clerk_student",
      taskType: "cv",
      mentorStatus: "approved",
    });

    status = await asStudent.query(api.onboarding.getStatus, {});
    expect(status.steps.cv).toBe(true);
    expect(status.stepStates.cv).toBe("completed");
  });

  test("needs_revision keeps the step incomplete and surfaces the mentor's note", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    await asStudent.mutation(api.onboarding.submitTask, { taskType: "motivation_letter" });
    const reviewed = await asAdmin.mutation(api.onboarding.reviewTask, {
      userId: "clerk_student",
      taskType: "motivation_letter",
      mentorStatus: "needs_revision",
      revisionNote: "Add a concrete example of past work.",
    });

    expect(reviewed.revisionNote).toBe("Add a concrete example of past work.");
    const status = await asStudent.query(api.onboarding.getStatus, {});
    expect(status.steps.motivation_letter).toBe(false);
    expect(status.stepStates.motivation_letter).toBe("needs_revision");
  });

  test("a non-admin cannot review tasks", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await expect(
      asStudent.mutation(api.onboarding.reviewTask, {
        userId: "clerk_student",
        taskType: "cv",
        mentorStatus: "approved",
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("onboarding.issueCertificateDecision", () => {
  async function driveParticipantToCertificateEligible(
    asStudent: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
    asAdmin: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>
  ) {
    await asStudent.mutation(api.onboarding.updateLabProfile, {
      fullName: "Dilnoza K.",
      linkedinUrl: "https://linkedin.com/in/dilnoza",
      interests: ["grants"],
    });
    for (const taskType of REVIEWABLE_TASKS) {
      await asStudent.mutation(api.onboarding.submitTask, { taskType });
      await asAdmin.mutation(api.onboarding.reviewTask, {
        userId: "clerk_student",
        taskType,
        mentorStatus: "approved",
      });
    }
    await asAdmin.mutation(api.onboarding.updateParticipantForAdmin, {
      userId: "clerk_student",
      attendancePercent: 85,
    });
  }

  test("is blocked with specific reasons when the participant hasn't finished everything", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    // Approve everything except attendance.
    await asStudent.mutation(api.onboarding.updateLabProfile, {
      fullName: "Dilnoza K.",
      linkedinUrl: "https://linkedin.com/in/dilnoza",
      interests: ["grants"],
    });
    for (const taskType of REVIEWABLE_TASKS) {
      await asStudent.mutation(api.onboarding.submitTask, { taskType });
      await asAdmin.mutation(api.onboarding.reviewTask, {
        userId: "clerk_student",
        taskType,
        mentorStatus: "approved",
      });
    }

    const decision = await asAdmin.mutation(api.onboarding.issueCertificateDecision, {
      userId: "clerk_student",
    });

    expect(decision.status).toBe("blocked");
    expect(decision.blockedReasons).toEqual(["attendance_below_70"]);
  });

  test("issues the certificate once every required check passes", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    await driveParticipantToCertificateEligible(asStudent, asAdmin);

    const decision = await asAdmin.mutation(api.onboarding.issueCertificateDecision, {
      userId: "clerk_student",
    });

    expect(decision.status).toBe("issued");
    expect(decision.blockedReasons).toEqual([]);
  });

  test("is idempotent — re-issuing returns the original decision instead of creating a second one", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    await driveParticipantToCertificateEligible(asStudent, asAdmin);

    const first = await asAdmin.mutation(api.onboarding.issueCertificateDecision, { userId: "clerk_student" });
    const second = await asAdmin.mutation(api.onboarding.issueCertificateDecision, { userId: "clerk_student" });

    expect(second.id).toBe(first.id);
    const decisions = await t.run((ctx) => ctx.db.query("labCertificateDecisions").collect());
    expect(decisions).toHaveLength(1);
  });

  test("a non-admin cannot issue certificates", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await expect(
      asStudent.mutation(api.onboarding.issueCertificateDecision, { userId: "clerk_student" })
    ).rejects.toThrow("Admin access required");
  });
});
