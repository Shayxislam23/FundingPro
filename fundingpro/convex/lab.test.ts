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

async function seedActiveDocument(ctx: MutationCtx, userId: Id<"users">, status = "active") {
  const now = Date.now();
  return await ctx.db.insert("documents", {
    userId,
    fileName: "proof.pdf",
    storageKey: "test-key",
    docType: "payment_proof",
    status,
    createdAt: now,
    updatedAt: now,
  });
}

function identity(tokenIdentifier: string, clerkId: string) {
  return { tokenIdentifier, subject: clerkId };
}

describe("lab.getMyAccess", () => {
  test("returns not_enrolled with an 'enroll' next action before any cohort exists", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const access = await asStudent.query(api.lab.getMyAccess, {});

    expect(access.accessState).toBe("not_enrolled");
    expect(access.hasPaidAccess).toBe(false);
    expect(access.nextAction.kind).toBe("enroll");
    expect(access.enrollment).toBeNull();
  });
});

describe("lab.ensureMyEnrollment", () => {
  test("creates a cohort and a pending_payment enrollment on first call", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const access = await asStudent.mutation(api.lab.ensureMyEnrollment, {});

    expect(access.accessState).toBe("pending_payment");
    expect(access.enrollment).not.toBeNull();
    expect(access.nextAction.kind).toBe("pay");

    const user = await t.run((ctx) => ctx.db.get("users", userId));
    expect(user?.userMode).toBe("individual");
  });

  test("is idempotent — a second call does not create a duplicate enrollment", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await asStudent.mutation(api.lab.ensureMyEnrollment, {});
    await asStudent.mutation(api.lab.ensureMyEnrollment, {});

    const enrollments = await t.run((ctx) => ctx.db.query("labEnrollments").collect());
    expect(enrollments).toHaveLength(1);
  });
});

describe("lab.createMyPaymePayment", () => {
  test("creates a payment sized in tiyin and linked to the enrollment", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const result = await asStudent.mutation(api.lab.createMyPaymePayment, {});

    expect(result.amountUzs).toBe(150_000);
    expect(result.amountTiyin).toBe(15_000_000);
    expect(result.enrollment.status).toBe("pending_payment");

    const payment = await t.run((ctx) => ctx.db.get("payments", result.paymentId as Id<"payments">));
    expect(payment?.provider).toBe("payme");
    expect(payment?.serviceType).toBe("lab_course");
    expect(payment?.status).toBe("PENDING");
  });

  test("reuses the existing pending payment instead of creating a duplicate", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const first = await asStudent.mutation(api.lab.createMyPaymePayment, {});
    const second = await asStudent.mutation(api.lab.createMyPaymePayment, {});

    expect(second.paymentId).toBe(first.paymentId);
    const payments = await t.run((ctx) =>
      ctx.db
        .query("payments")
        .withIndex("by_user_and_serviceType_and_status", (q) =>
          q.eq("userId", userId).eq("serviceType", "lab_course").eq("status", "PENDING")
        )
        .collect()
    );
    expect(payments).toHaveLength(1);
  });

  test("refuses to create a new payment once the enrollment is already paid", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const initial = await asStudent.mutation(api.lab.createMyPaymePayment, {});
    await t.run((ctx) =>
      ctx.db.patch("labEnrollments", initial.enrollment.id as Id<"labEnrollments">, { status: "paid" })
    );

    await expect(asStudent.mutation(api.lab.createMyPaymePayment, {})).rejects.toThrow(
      "already paid"
    );
  });
});

describe("lab.submitManualPaymentProof", () => {
  test("moves the enrollment to manual_review with a valid own document", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const documentId = await t.run((ctx) => seedActiveDocument(ctx, userId));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const access = await asStudent.mutation(api.lab.submitManualPaymentProof, { documentId });

    expect(access.accessState).toBe("manual_review");
    expect(access.enrollment?.manualProofDocumentId).toBe(documentId);
    expect(access.nextAction.kind).toBe("await_manual_review");
  });

  test("rejects a document that belongs to another user", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const otherUserId = await t.run((ctx) => seedUser(ctx, "token:other", "clerk_other"));
    const foreignDocumentId = await t.run((ctx) => seedActiveDocument(ctx, otherUserId));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await expect(
      asStudent.mutation(api.lab.submitManualPaymentProof, { documentId: foreignDocumentId })
    ).rejects.toThrow("not found");
  });

  test("rejects a document that isn't active", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const deletedDocumentId = await t.run((ctx) => seedActiveDocument(ctx, userId, "deleted"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await expect(
      asStudent.mutation(api.lab.submitManualPaymentProof, { documentId: deletedDocumentId })
    ).rejects.toThrow("not found");
  });
});

describe("lab.markEnrollmentStatus (admin)", () => {
  test("stamps paidAt only when transitioning to paid", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    const access = await asStudent.mutation(api.lab.ensureMyEnrollment, {});
    const enrollmentId = access.enrollment!.id as Id<"labEnrollments">;

    const reviewed = await asAdmin.mutation(api.lab.markEnrollmentStatus, {
      enrollmentId,
      status: "manual_review",
      notes: "waiting on bank statement",
    });
    expect(reviewed.paidAt).toBeNull();

    const paid = await asAdmin.mutation(api.lab.markEnrollmentStatus, {
      enrollmentId,
      status: "paid",
    });
    expect(paid.paidAt).not.toBeNull();
  });

  test("a non-admin cannot mark an enrollment paid", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const access = await asStudent.mutation(api.lab.ensureMyEnrollment, {});
    const enrollmentId = access.enrollment!.id as Id<"labEnrollments">;

    await expect(
      asStudent.mutation(api.lab.markEnrollmentStatus, { enrollmentId, status: "paid" })
    ).rejects.toThrow("Admin access required");
  });
});

describe("lab.upsertMyApplication", () => {
  test("creates a planned application by default", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    const application = await asStudent.mutation(api.lab.upsertMyApplication, {
      title: "UNDP Youth Grant",
      submissionMethod: "google_form",
    });

    expect(application.status).toBe("planned");
    expect(application.title).toBe("UNDP Youth Grant");
  });

  test("a user cannot edit another user's application", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:other", "clerk_other"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asOther = t.withIdentity(identity("token:other", "clerk_other"));

    const application = await asStudent.mutation(api.lab.upsertMyApplication, {
      title: "UNDP Youth Grant",
      submissionMethod: "google_form",
    });

    await expect(
      asOther.mutation(api.lab.upsertMyApplication, {
        applicationId: application.id as Id<"labOpportunityApplications">,
        title: "Hijacked title",
        submissionMethod: "email",
      })
    ).rejects.toThrow("not found");
  });

  test("rejects a proof document owned by someone else", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    const otherUserId = await t.run((ctx) => seedUser(ctx, "token:other", "clerk_other"));
    const foreignDocumentId = await t.run((ctx) => seedActiveDocument(ctx, otherUserId));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));

    await expect(
      asStudent.mutation(api.lab.upsertMyApplication, {
        title: "UNDP Youth Grant",
        submissionMethod: "google_form",
        proofDocumentId: foreignDocumentId,
      })
    ).rejects.toThrow("not found");
  });
});

describe("lab.reviewApplication (admin)", () => {
  test("approves an application and records who reviewed it", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => seedUser(ctx, "token:student", "clerk_student"));
    await t.run((ctx) => seedUser(ctx, "token:admin", "clerk_admin", "admin"));
    const asStudent = t.withIdentity(identity("token:student", "clerk_student"));
    const asAdmin = t.withIdentity(identity("token:admin", "clerk_admin"));

    const application = await asStudent.mutation(api.lab.upsertMyApplication, {
      title: "UNDP Youth Grant",
      submissionMethod: "google_form",
    });

    const reviewed = await asAdmin.mutation(api.lab.reviewApplication, {
      applicationId: application.id as Id<"labOpportunityApplications">,
      status: "approved",
      mentorNotes: "Looks solid, submit before Friday.",
    });

    expect(reviewed.status).toBe("approved");
    expect(reviewed.mentorNotes).toBe("Looks solid, submit before Friday.");
    expect(reviewed.reviewedAt).not.toBeNull();
  });
});
