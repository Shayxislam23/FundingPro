import { v } from "convex/values";
import { authedMutation, authedQuery, adminMutation, adminQuery } from "./lib/customFunctions";
import { externalUserId } from "./lib/auth";
import { patchUserMode, resolveLabCohortId } from "./lib/userMode";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_COHORT = {
  slug: "opportunities-lab-july-2026",
  name: "Мой путь — июль 2026",
  startsAt: Date.parse("2026-07-05T19:00:00+05:00"),
  firstLessonAt: Date.parse("2026-07-05T19:00:00+05:00"),
  firstLessonUrl: "https://t.me/fundingprouz",
  priceUzs: 150_000,
  status: "enrolling" as const,
  certificatePolicyVersion: "lab-v1",
};

const enrollmentStatusValidator = v.union(
  v.literal("pending_payment"),
  v.literal("manual_review"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("refunded")
);

const submissionMethodValidator = v.union(
  v.literal("google_form"),
  v.literal("email"),
  v.literal("external_portal"),
  v.literal("pdf_upload"),
  v.literal("other")
);

const applicationStatusValidator = v.union(
  v.literal("planned"),
  v.literal("preparing"),
  v.literal("submitted"),
  v.literal("proof_uploaded"),
  v.literal("approved"),
  v.literal("needs_revision"),
  v.literal("rejected")
);

const labAccessStateValidator = v.union(
  v.literal("not_enrolled"),
  v.literal("pending_payment"),
  v.literal("manual_review"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("refunded")
);

type LabAccessState = "not_enrolled" | Doc<"labEnrollments">["status"];

const labNextActionValidator = v.object({
  kind: v.union(
    v.literal("enroll"),
    v.literal("pay"),
    v.literal("await_manual_review"),
    v.literal("open_lab"),
    v.literal("contact_support")
  ),
  label: v.string(),
  href: v.string(),
  tone: v.union(v.literal("primary"), v.literal("warning"), v.literal("success"), v.literal("danger")),
  description: v.string(),
});

const cohortRowValidator = v.object({
  id: v.union(v.string(), v.null()),
  slug: v.string(),
  name: v.string(),
  startsAt: v.string(),
  firstLessonAt: v.union(v.string(), v.null()),
  firstLessonUrl: v.union(v.string(), v.null()),
  priceUzs: v.number(),
  status: v.string(),
});

const enrollmentRowValidator = v.object({
  id: v.string(),
  status: enrollmentStatusValidator,
  amountUzs: v.number(),
  manualProofDocumentId: v.union(v.string(), v.null()),
  paidAt: v.union(v.string(), v.null()),
  reviewedAt: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
});

const labAccessValidator = v.object({
  cohort: cohortRowValidator,
  enrollment: v.union(enrollmentRowValidator, v.null()),
  hasPaidAccess: v.boolean(),
  accessState: labAccessStateValidator,
  nextAction: labNextActionValidator,
});

const labPaymePaymentValidator = v.object({
  paymentId: v.string(),
  amountUzs: v.number(),
  amountTiyin: v.number(),
  cohort: cohortRowValidator,
  enrollment: enrollmentRowValidator,
});

const adminEnrollmentRowValidator = v.object({
  id: v.string(),
  userId: v.string(),
  email: v.union(v.string(), v.null()),
  fullName: v.union(v.string(), v.null()),
  telegramUsername: v.union(v.string(), v.null()),
  cohortName: v.string(),
  status: enrollmentStatusValidator,
  amountUzs: v.number(),
  manualProofDocumentId: v.union(v.string(), v.null()),
  paidAt: v.union(v.string(), v.null()),
  reviewedAt: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
});

const applicationRowValidator = v.object({
  id: v.string(),
  title: v.string(),
  opportunityUrl: v.union(v.string(), v.null()),
  submissionMethod: submissionMethodValidator,
  status: applicationStatusValidator,
  proofDocumentId: v.union(v.string(), v.null()),
  submittedAt: v.union(v.string(), v.null()),
  reviewedAt: v.union(v.string(), v.null()),
  mentorNotes: v.union(v.string(), v.null()),
});

function mapCohort(cohort: Doc<"labCohorts"> | null) {
  return {
    id: cohort?._id ?? null,
    slug: cohort?.slug ?? DEFAULT_COHORT.slug,
    name: cohort?.name ?? DEFAULT_COHORT.name,
    startsAt: new Date(cohort?.startsAt ?? DEFAULT_COHORT.startsAt).toISOString(),
    firstLessonAt: cohort?.firstLessonAt ? new Date(cohort.firstLessonAt).toISOString() : new Date(DEFAULT_COHORT.firstLessonAt).toISOString(),
    firstLessonUrl: cohort?.firstLessonUrl ?? DEFAULT_COHORT.firstLessonUrl,
    priceUzs: cohort?.priceUzs ?? DEFAULT_COHORT.priceUzs,
    status: cohort?.status ?? DEFAULT_COHORT.status,
  };
}

function mapEnrollment(enrollment: Doc<"labEnrollments"> | null) {
  if (!enrollment) return null;
  return {
    id: enrollment._id,
    status: enrollment.status,
    amountUzs: enrollment.amountUzs,
    manualProofDocumentId: enrollment.manualProofDocumentId ?? null,
    paidAt: enrollment.paidAt ? new Date(enrollment.paidAt).toISOString() : null,
    reviewedAt: enrollment.reviewedAt ? new Date(enrollment.reviewedAt).toISOString() : null,
    notes: enrollment.notes ?? null,
  };
}

function resolveAccessState(enrollment: Doc<"labEnrollments"> | null): LabAccessState {
  return enrollment?.status ?? "not_enrolled";
}

function resolveNextAction(enrollment: Doc<"labEnrollments"> | null) {
  const state = resolveAccessState(enrollment);
  if (state === "paid") {
    return {
      kind: "open_lab" as const,
      label: "Open Lab workflow",
      href: "/dashboard/lab",
      tone: "success" as const,
      description: "Payment is confirmed. Continue profile, mentor review, and certificate tasks.",
    };
  }
  if (state === "manual_review") {
    return {
      kind: "await_manual_review" as const,
      label: "Await manual review",
      href: "/dashboard/lab/checkout",
      tone: "warning" as const,
      description: "Payment proof is uploaded. Admin review is required before Lab access opens.",
    };
  }
  if (state === "failed" || state === "refunded") {
    return {
      kind: "contact_support" as const,
      label: "Contact support",
      href: "/dashboard/support",
      tone: "danger" as const,
      description: "This enrollment needs support review before another payment attempt.",
    };
  }
  if (state === "pending_payment") {
    return {
      kind: "pay" as const,
      label: "Pay for Lab",
      href: "/dashboard/lab/checkout",
      tone: "primary" as const,
      description: "Complete online payment or upload manual payment proof to unlock Lab access.",
    };
  }
  return {
    kind: "enroll" as const,
    label: "Reserve Lab seat",
    href: "/dashboard/lab/checkout",
    tone: "primary" as const,
    description: "Reserve your seat and choose Payme or manual payment.",
  };
}

function mapAccess(cohort: Doc<"labCohorts"> | null, enrollment: Doc<"labEnrollments"> | null) {
  return {
    cohort: mapCohort(cohort),
    enrollment: mapEnrollment(enrollment),
    hasPaidAccess: enrollment?.status === "paid",
    accessState: resolveAccessState(enrollment),
    nextAction: resolveNextAction(enrollment),
  };
}

function mapApplication(row: Doc<"labOpportunityApplications">) {
  return {
    id: row._id,
    title: row.title,
    opportunityUrl: row.opportunityUrl ?? null,
    submissionMethod: row.submissionMethod,
    status: row.status,
    proofDocumentId: row.proofDocumentId ?? null,
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : null,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
    mentorNotes: row.mentorNotes ?? null,
  };
}

async function getCohortBySlug(ctx: { db: QueryCtx["db"] }, slug = DEFAULT_COHORT.slug) {
  return await ctx.db
    .query("labCohorts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

async function ensureCohort(ctx: { db: MutationCtx["db"] }, slug = DEFAULT_COHORT.slug) {
  const existing = await ctx.db
    .query("labCohorts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("labCohorts", {
    ...DEFAULT_COHORT,
    slug,
    createdAt: now,
    updatedAt: now,
  });
  const cohort = await ctx.db.get(id);
  if (!cohort) throw new Error("Failed to create Lab cohort");
  return cohort;
}

async function getEnrollment(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  cohortId: Id<"labCohorts">
) {
  return await ctx.db
    .query("labEnrollments")
    .withIndex("by_user_and_cohort", (q) =>
      q.eq("userId", userId).eq("cohortId", cohortId)
    )
    .unique();
}

async function ensureEnrollmentForUser(
  ctx: { db: MutationCtx["db"] },
  userId: Id<"users">,
  cohort: Doc<"labCohorts">
) {
  const existing = await ctx.db
    .query("labEnrollments")
    .withIndex("by_user_and_cohort", (q) =>
      q.eq("userId", userId).eq("cohortId", cohort._id)
    )
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("labEnrollments", {
    userId,
    cohortId: cohort._id,
    status: "pending_payment",
    amountUzs: cohort.priceUzs,
    createdAt: now,
    updatedAt: now,
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Failed to create Lab enrollment");
  return row;
}

export const getMyAccess = authedQuery({
  args: { cohortSlug: v.optional(v.string()) },
  returns: labAccessValidator,
  handler: async (ctx, args) => {
    const cohort = await getCohortBySlug(ctx, args.cohortSlug);
    const enrollment = cohort ? await getEnrollment(ctx, ctx.user._id, cohort._id) : null;
    return mapAccess(cohort, enrollment);
  },
});

export const ensureMyEnrollment = authedMutation({
  args: { cohortSlug: v.optional(v.string()) },
  returns: labAccessValidator,
  handler: async (ctx, args) => {
    const cohort = await ensureCohort(ctx, args.cohortSlug);
    const existing = await getEnrollment(ctx, ctx.user._id, cohort._id);

    if (!existing) {
      const now = Date.now();
      await ctx.db.insert("labEnrollments", {
        userId: ctx.user._id,
        cohortId: cohort._id,
        status: "pending_payment",
        amountUzs: cohort.priceUzs,
        createdAt: now,
        updatedAt: now,
      });
      await patchUserMode(ctx, ctx.user._id, "individual");
    }

    const enrollment = await getEnrollment(ctx, ctx.user._id, cohort._id);
    return mapAccess(cohort, enrollment);
  },
});

export const createMyPaymePayment = authedMutation({
  args: { cohortSlug: v.optional(v.string()) },
  returns: labPaymePaymentValidator,
  handler: async (ctx, args) => {
    const cohort = await ensureCohort(ctx, args.cohortSlug);
    const enrollment = await ensureEnrollmentForUser(ctx, ctx.user._id, cohort);
    if (enrollment.status === "paid") {
      throw new Error("Lab enrollment is already paid");
    }

    const amountTiyin = cohort.priceUzs * 100;
    const idempotencyKey = `lab-course-${ctx.user._id}-${cohort._id}-payme`;
    const now = Date.now();
    const existingPayments = await ctx.db
      .query("payments")
      .withIndex("by_user_and_serviceType_and_status", (q) =>
        q.eq("userId", ctx.user._id).eq("serviceType", "lab_course").eq("status", "PENDING")
      )
      .order("desc")
      .take(20);
    const existingPayment = existingPayments.find((payment) => {
      const meta = payment.metadata ?? {};
      return (
        payment.provider === "payme" &&
        meta.labEnrollmentId === enrollment._id &&
        meta.labCohortId === cohort._id
      );
    });

    let paymentId = existingPayment?._id;
    if (!paymentId) {
      paymentId = await ctx.db.insert("payments", {
        userId: ctx.user._id,
        amountUsd: Number((cohort.priceUzs / 12800).toFixed(2)),
        currency: "UZS",
        status: "PENDING",
        provider: "payme",
        idempotencyKey,
        serviceType: "lab_course",
        metadata: {
          amountUzs: cohort.priceUzs,
          amountTiyin,
          labEnrollmentId: enrollment._id,
          labCohortId: cohort._id,
          labCohortSlug: cohort.slug,
          serviceName: cohort.name,
          planName: cohort.name,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(enrollment._id, {
      status: "pending_payment",
      amountUzs: cohort.priceUzs,
      paymentId,
      updatedAt: now,
    });

    const updatedEnrollment = await ctx.db.get(enrollment._id);
    if (!updatedEnrollment) throw new Error("Lab enrollment not found");

    return {
      paymentId,
      amountUzs: cohort.priceUzs,
      amountTiyin,
      cohort: mapCohort(cohort),
      enrollment: mapEnrollment(updatedEnrollment)!,
    };
  },
});

export const submitManualPaymentProof = authedMutation({
  args: {
    documentId: v.id("documents"),
    cohortSlug: v.optional(v.string()),
  },
  returns: labAccessValidator,
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== ctx.user._id || doc.status !== "active") {
      throw new Error("Payment proof document not found");
    }

    const cohort = await ensureCohort(ctx, args.cohortSlug);
    const existing = await getEnrollment(ctx, ctx.user._id, cohort._id);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "manual_review",
        manualProofDocumentId: args.documentId,
        amountUzs: cohort.priceUzs,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("labEnrollments", {
        userId: ctx.user._id,
        cohortId: cohort._id,
        status: "manual_review",
        amountUzs: cohort.priceUzs,
        manualProofDocumentId: args.documentId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const enrollment = await getEnrollment(ctx, ctx.user._id, cohort._id);
    return mapAccess(cohort, enrollment);
  },
});

export const listEnrollmentsForAdmin = adminQuery({
  args: { limit: v.number(), cohortSlug: v.optional(v.string()) },
  returns: v.object({ enrollments: v.array(adminEnrollmentRowValidator) }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit, 1), 200);
    const cohort = await getCohortBySlug(ctx, args.cohortSlug);
    const rows = cohort
      ? await ctx.db
          .query("labEnrollments")
          .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
          .order("desc")
          .take(limit)
      : await ctx.db.query("labEnrollments").order("desc").take(limit);

    const enrollments = await Promise.all(rows.map(async (row) => {
      const [user, participant, rowCohort] = await Promise.all([
        ctx.db.get(row.userId),
        ctx.db
          .query("labParticipants")
          .withIndex("by_user", (q) => q.eq("userId", row.userId))
          .first(),
        ctx.db.get(row.cohortId),
      ]);

      return {
        id: row._id,
        userId: user ? externalUserId(user) : row.userId,
        email: user?.email ?? null,
        fullName: participant?.fullName ?? null,
        telegramUsername: participant?.telegramUsername ?? null,
        cohortName: rowCohort?.name ?? "Lab cohort",
        status: row.status,
        amountUzs: row.amountUzs,
        manualProofDocumentId: row.manualProofDocumentId ?? null,
        paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null,
        reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
        notes: row.notes ?? null,
      };
    }));

    return { enrollments };
  },
});

export const markEnrollmentStatus = adminMutation({
  args: {
    enrollmentId: v.id("labEnrollments"),
    status: enrollmentStatusValidator,
    notes: v.optional(v.string()),
  },
  returns: enrollmentRowValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.enrollmentId);
    if (!existing) throw new Error("Enrollment not found");

    const now = Date.now();
    await ctx.db.patch(args.enrollmentId, {
      status: args.status,
      notes: args.notes,
      paidAt: args.status === "paid" ? now : existing.paidAt,
      reviewedAt: now,
      reviewedBy: ctx.user._id,
      updatedAt: now,
    });

    const updated = await ctx.db.get(args.enrollmentId);
    return mapEnrollment(updated)!;
  },
});

export const listMyApplications = authedQuery({
  args: {},
  returns: v.array(applicationRowValidator),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("labOpportunityApplications")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .take(50);
    return rows.map(mapApplication);
  },
});

export const upsertMyApplication = authedMutation({
  args: {
    applicationId: v.optional(v.id("labOpportunityApplications")),
    title: v.string(),
    opportunityUrl: v.optional(v.string()),
    submissionMethod: submissionMethodValidator,
    status: v.optional(applicationStatusValidator),
    proofDocumentId: v.optional(v.id("documents")),
  },
  returns: applicationRowValidator,
  handler: async (ctx, args) => {
    if (args.proofDocumentId) {
      const proof = await ctx.db.get(args.proofDocumentId);
      if (!proof || proof.userId !== ctx.user._id || proof.status !== "active") {
        throw new Error("Proof document not found");
      }
    }

    const now = Date.now();
    const accessCohort = await getCohortBySlug(ctx);
    const data = {
      title: args.title.trim(),
      opportunityUrl: args.opportunityUrl?.trim() || undefined,
      submissionMethod: args.submissionMethod,
      status: args.status ?? (args.proofDocumentId ? "proof_uploaded" as const : "planned" as const),
      proofDocumentId: args.proofDocumentId,
      submittedAt: args.status === "submitted" || args.proofDocumentId ? now : undefined,
      updatedAt: now,
    };

    let id = args.applicationId;
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.userId !== ctx.user._id) {
        throw new Error("Application not found");
      }
      await ctx.db.patch(id, data);
    } else {
      id = await ctx.db.insert("labOpportunityApplications", {
        userId: ctx.user._id,
        cohortId: accessCohort?._id,
        ...data,
        createdAt: now,
      });
    }

    const row = await ctx.db.get(id);
    if (!row) throw new Error("Application save failed");
    return mapApplication(row);
  },
});

export const reviewApplication = adminMutation({
  args: {
    applicationId: v.id("labOpportunityApplications"),
    status: v.union(v.literal("approved"), v.literal("needs_revision"), v.literal("rejected")),
    mentorNotes: v.optional(v.string()),
  },
  returns: applicationRowValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.applicationId);
    if (!existing) throw new Error("Application not found");

    await ctx.db.patch(args.applicationId, {
      status: args.status,
      mentorNotes: args.mentorNotes,
      reviewedAt: Date.now(),
      reviewedBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    const row = await ctx.db.get(args.applicationId);
    if (!row) throw new Error("Application review failed");
    return mapApplication(row);
  },
});
