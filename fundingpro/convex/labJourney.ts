import { v } from "convex/values";
import { adminMutation, adminQuery, authedMutation, authedQuery } from "./lib/customFunctions";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Opportunities Lab guided onboarding: derives a 10-step journey from the
 * lab profile plus existing platform data (saved grants, applications,
 * documents, proposals). Additive layer — no existing tables are modified.
 */

export const LAB_STEP_IDS = [
  "registration",
  "profile",
  "interests",
  "cv",
  "linkedin",
  "opportunities",
  "motivation",
  "chosen",
  "application",
  "proof",
] as const;

const OPPORTUNITIES_TARGET = 10;

const stepStateValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("submitted"),
  v.literal("needs_revision"),
  v.literal("completed")
);

const stepValidator = v.object({
  id: v.string(),
  state: stepStateValidator,
  done: v.boolean(),
});

const certificateValidator = v.object({
  eligible: v.boolean(),
  requirements: v.array(v.object({ id: v.string(), done: v.boolean() })),
});

const labProfileValidator = v.object({
  fullName: v.union(v.string(), v.null()),
  age: v.union(v.number(), v.null()),
  city: v.union(v.string(), v.null()),
  telegram: v.union(v.string(), v.null()),
  educationStatus: v.union(v.string(), v.null()),
  interests: v.array(v.string()),
  cvStatus: v.union(v.string(), v.null()),
  linkedinUrl: v.union(v.string(), v.null()),
  motivationLetterStatus: v.union(v.string(), v.null()),
  chosenGrantId: v.union(v.string(), v.null()),
  applicationProofStatus: v.union(v.string(), v.null()),
});

const journeyValidator = v.object({
  steps: v.array(stepValidator),
  progressPercent: v.number(),
  nextStepId: v.union(v.string(), v.null()),
  certificate: certificateValidator,
  profile: labProfileValidator,
  savedGrantsCount: v.number(),
  opportunitiesTarget: v.number(),
});

type StepState = "not_started" | "in_progress" | "submitted" | "needs_revision" | "completed";
type Step = { id: string; state: StepState; done: boolean };

function isStepDone(state: StepState): boolean {
  return state === "completed" || state === "submitted";
}

function reviewableState(
  status: "submitted" | "needs_revision" | "approved" | undefined,
  hasDraft: boolean
): StepState {
  if (status === "approved") return "completed";
  if (status === "submitted") return "submitted";
  if (status === "needs_revision") return "needs_revision";
  return hasDraft ? "in_progress" : "not_started";
}

async function computeJourney(ctx: QueryCtx, userId: Id<"users">, p: Doc<"labParticipants"> | null) {
  const [activeDocs, savedGrants, submittedApp, anyApp, proposal] = await Promise.all([
    ctx.db
      .query("documents")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .take(50),
    ctx.db
      .query("savedGrants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(OPPORTUNITIES_TARGET),
    ctx.db
      .query("applications")
      .withIndex("by_user_and_status", (q) => q.eq("userId", userId).eq("status", "SUBMITTED"))
      .first(),
    ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
    ctx.db
      .query("proposalProjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
  ]);

  const hasCvDoc = activeDocs.some((d) => d.docType === "CV");
  const interests = p?.interests ?? [];
  const profileComplete = Boolean(p?.fullName && p?.city && p?.telegram && p?.educationStatus);
  const profileStarted = Boolean(p?.fullName || p?.city || p?.telegram || p?.educationStatus);
  const savedGrantsCount = savedGrants.length;
  const proofDone = p?.applicationProofStatus === "submitted" || p?.applicationProofStatus === "approved";

  const steps: Step[] = [];
  const push = (id: string, state: StepState) => steps.push({ id, state, done: isStepDone(state) });

  push("registration", "completed");
  push("profile", profileComplete ? "completed" : profileStarted ? "in_progress" : "not_started");
  push("interests", interests.length > 0 ? "completed" : "not_started");
  push(
    "cv",
    p?.cvStatus === "uploaded" || hasCvDoc
      ? "completed"
      : p?.cvStatus === "help_requested"
        ? "in_progress"
        : "not_started"
  );
  push("linkedin", p?.linkedinUrl ? "completed" : "not_started");
  push(
    "opportunities",
    savedGrantsCount >= OPPORTUNITIES_TARGET
      ? "completed"
      : savedGrantsCount > 0
        ? "in_progress"
        : "not_started"
  );
  push("motivation", reviewableState(p?.motivationLetterStatus, Boolean(proposal)));
  push("chosen", p?.chosenGrantId || anyApp ? "completed" : "not_started");
  push(
    "application",
    submittedApp || proofDone ? "completed" : anyApp ? "in_progress" : "not_started"
  );
  push("proof", reviewableState(p?.applicationProofStatus, false));

  const doneCount = steps.filter((s) => s.done).length;
  const nextStepId = steps.find((s) => !s.done)?.id ?? null;

  const motivationDone = steps.find((s) => s.id === "motivation")?.done ?? false;
  const applicationDone = steps.find((s) => s.id === "application")?.done ?? false;
  const cvDone = steps.find((s) => s.id === "cv")?.done ?? false;

  const certificateRequirements = [
    { id: "profile", done: profileComplete },
    { id: "cv", done: cvDone },
    { id: "motivation", done: motivationDone },
    { id: "linkedin", done: Boolean(p?.linkedinUrl) },
    { id: "opportunities", done: savedGrantsCount >= OPPORTUNITIES_TARGET },
    { id: "application", done: applicationDone },
    { id: "attendance", done: p?.attendanceOk === true },
  ];

  return {
    steps,
    progressPercent: Math.round((doneCount / steps.length) * 100),
    nextStepId,
    certificate: {
      eligible: certificateRequirements.every((r) => r.done),
      requirements: certificateRequirements,
    },
    profile: {
      fullName: p?.fullName ?? null,
      age: p?.age ?? null,
      city: p?.city ?? null,
      telegram: p?.telegram ?? null,
      educationStatus: p?.educationStatus ?? null,
      interests,
      cvStatus: p?.cvStatus ?? null,
      linkedinUrl: p?.linkedinUrl ?? null,
      motivationLetterStatus: p?.motivationLetterStatus ?? null,
      chosenGrantId: p?.chosenGrantId ?? null,
      applicationProofStatus: p?.applicationProofStatus ?? null,
    },
    savedGrantsCount,
    opportunitiesTarget: OPPORTUNITIES_TARGET,
  };
}

export const getMyJourney = authedQuery({
  args: {},
  returns: journeyValidator,
  handler: async (ctx) => {
    const participant = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();
    return computeJourney(ctx, ctx.user._id, participant);
  },
});

export const updateMyProfile = authedMutation({
  args: {
    fullName: v.optional(v.string()),
    age: v.optional(v.number()),
    city: v.optional(v.string()),
    telegram: v.optional(v.string()),
    educationStatus: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    cvStatus: v.optional(v.union(v.literal("uploaded"), v.literal("help_requested"))),
    linkedinUrl: v.optional(v.string()),
    motivationLetterStatus: v.optional(v.literal("submitted")),
    chosenGrantId: v.optional(v.string()),
    applicationProofStatus: v.optional(v.literal("submitted")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.fullName !== undefined) patch.fullName = args.fullName.trim().slice(0, 200);
    if (args.age !== undefined) patch.age = args.age;
    if (args.city !== undefined) patch.city = args.city.trim().slice(0, 200);
    if (args.telegram !== undefined) patch.telegram = args.telegram.trim().slice(0, 100);
    if (args.educationStatus !== undefined)
      patch.educationStatus = args.educationStatus.trim().slice(0, 200);
    if (args.interests !== undefined) patch.interests = args.interests.slice(0, 12);
    if (args.cvStatus !== undefined) patch.cvStatus = args.cvStatus;
    if (args.linkedinUrl !== undefined) patch.linkedinUrl = args.linkedinUrl.trim().slice(0, 300);
    if (args.motivationLetterStatus !== undefined)
      patch.motivationLetterStatus = args.motivationLetterStatus;
    if (args.applicationProofStatus !== undefined)
      patch.applicationProofStatus = args.applicationProofStatus;
    if (args.chosenGrantId !== undefined) {
      const grant = await ctx.db.get("grants", args.chosenGrantId as Id<"grants">);
      if (grant) patch.chosenGrantId = grant._id;
    }

    if (existing) {
      await ctx.db.patch("labParticipants", existing._id, patch);
    } else {
      await ctx.db.insert("labParticipants", {
        userId: ctx.user._id,
        ...patch,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

/** Mentor hint derived from the first missing journey step. */
function mentorNextAction(nextStepId: string | null): string {
  switch (nextStepId) {
    case "profile":
      return "Напомнить участнику заполнить профиль";
    case "interests":
      return "Попросить отметить интересы";
    case "cv":
      return "Отправить шаблон CV или пригласить на урок по CV";
    case "linkedin":
      return "Помочь создать профиль LinkedIn";
    case "opportunities":
      return "Порекомендовать простые возможности для новичка";
    case "motivation":
      return "Напомнить про мотивационное письмо";
    case "chosen":
    case "application":
      return "Попросить выбрать одну возможность до финальной недели";
    case "proof":
      return "Попросить загрузить подтверждение заявки";
    case null:
      return "Все шаги выполнены — проверить сертификат";
    default:
      return "Поддерживать прогресс участника";
  }
}

const ADMIN_LIST_LIMIT = 200;

export const adminList = adminQuery({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      email: v.union(v.string(), v.null()),
      fullName: v.union(v.string(), v.null()),
      telegram: v.union(v.string(), v.null()),
      mentorStatus: v.union(v.string(), v.null()),
      mentorNotes: v.union(v.string(), v.null()),
      attendanceOk: v.boolean(),
      steps: v.array(stepValidator),
      progressPercent: v.number(),
      certificateEligible: v.boolean(),
      nextAction: v.string(),
      updatedAt: v.string(),
    })
  ),
  handler: async (ctx) => {
    const participants = await ctx.db.query("labParticipants").order("desc").take(ADMIN_LIST_LIMIT);

    // Fan out per-participant reads instead of awaiting them one at a time —
    // at ADMIN_LIST_LIMIT rows a sequential loop was ~6 round trips each.
    const rows = await Promise.all(
      participants.map(async (p) => {
        const [user, journey] = await Promise.all([
          ctx.db.get("users", p.userId),
          computeJourney(ctx, p.userId, p),
        ]);
        return {
          id: p._id,
          email: user?.email ?? null,
          fullName: p.fullName ?? null,
          telegram: p.telegram ?? null,
          mentorStatus: p.mentorStatus ?? null,
          mentorNotes: p.mentorNotes ?? null,
          attendanceOk: p.attendanceOk === true,
          steps: journey.steps,
          progressPercent: journey.progressPercent,
          certificateEligible: journey.certificate.eligible,
          nextAction: mentorNextAction(journey.nextStepId),
          updatedAt: new Date(p.updatedAt).toISOString(),
        };
      })
    );
    return rows;
  },
});

export const adminUpdate = adminMutation({
  args: {
    participantId: v.string(),
    mentorStatus: v.optional(v.string()),
    mentorNotes: v.optional(v.string()),
    attendanceOk: v.optional(v.boolean()),
    motivationLetterStatus: v.optional(
      v.union(v.literal("submitted"), v.literal("needs_revision"), v.literal("approved"))
    ),
    applicationProofStatus: v.optional(
      v.union(v.literal("submitted"), v.literal("needs_revision"), v.literal("approved"))
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(
      "labParticipants",
      args.participantId as Id<"labParticipants">
    );
    if (!participant) throw new Error("Participant not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.mentorStatus !== undefined) patch.mentorStatus = args.mentorStatus.slice(0, 60);
    if (args.mentorNotes !== undefined) patch.mentorNotes = args.mentorNotes.slice(0, 2000);
    if (args.attendanceOk !== undefined) patch.attendanceOk = args.attendanceOk;
    if (args.motivationLetterStatus !== undefined)
      patch.motivationLetterStatus = args.motivationLetterStatus;
    if (args.applicationProofStatus !== undefined)
      patch.applicationProofStatus = args.applicationProofStatus;

    await ctx.db.patch("labParticipants", participant._id, patch);
    return null;
  },
});
