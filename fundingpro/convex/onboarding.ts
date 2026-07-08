import { v } from "convex/values";
import { authedMutation, authedQuery, adminMutation, adminQuery } from "./lib/customFunctions";
import { externalUserId, getUserByExternalId } from "./lib/auth";
import { patchUserMode, resolveLabCohortId } from "./lib/userMode";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

const progressState = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("submitted"),
  v.literal("needs_revision"),
  v.literal("completed")
);

const labStepsValidator = v.object({
  registration: v.boolean(),
  profile: v.boolean(),
  interests: v.boolean(),
  cv: v.boolean(),
  linkedin: v.boolean(),
  opportunities_10: v.boolean(),
  motivation_letter: v.boolean(),
  chosen_opportunity: v.boolean(),
  application_submitted: v.boolean(),
  proof_uploaded: v.boolean(),
});

const labTaskType = v.union(
  v.literal("profile"),
  v.literal("interests"),
  v.literal("cv"),
  v.literal("linkedin"),
  v.literal("opportunities_10"),
  v.literal("motivation_letter"),
  v.literal("chosen_opportunity"),
  v.literal("application_submitted"),
  v.literal("proof_uploaded")
);

type LabTaskType =
  | "profile"
  | "interests"
  | "cv"
  | "linkedin"
  | "opportunities_10"
  | "motivation_letter"
  | "chosen_opportunity"
  | "application_submitted"
  | "proof_uploaded";

type MentorStatus = "pending_review" | "needs_revision" | "approved" | "rejected";
type CertificateDecisionStatus = "issued" | "blocked";

const mentorStatusValidator = v.union(
  v.literal("pending_review"),
  v.literal("needs_revision"),
  v.literal("approved"),
  v.literal("rejected")
);

const certificateDecisionStatusValidator = v.union(
  v.literal("issued"),
  v.literal("blocked")
);

const certificateDecisionValidator = v.object({
  id: v.string(),
  userId: v.string(),
  cohortId: v.union(v.string(), v.null()),
  status: certificateDecisionStatusValidator,
  policyVersion: v.string(),
  requiredChecks: v.array(v.string()),
  blockedReasons: v.array(v.string()),
  decidedBy: v.string(),
  decidedAt: v.string(),
});

const labCohortStatsValidator = v.object({
  cohortId: v.string(),
  cohortName: v.string(),
  cohortSlug: v.string(),
  totalEnrollments: v.number(),
  paidEnrollments: v.number(),
  manualReviewEnrollments: v.number(),
  pendingPaymentEnrollments: v.number(),
  failedEnrollments: v.number(),
  refundedEnrollments: v.number(),
  totalParticipants: v.number(),
  certificateReady: v.number(),
  needsMentorReview: v.number(),
  needsReminder: v.number(),
  collectedUzs: v.number(),
  computedAt: v.string(),
});

const taskReviewValidator = v.object({
  taskType: labTaskType,
  studentStatus: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("submitted")
  ),
  mentorStatus: mentorStatusValidator,
  evidenceDocumentId: v.union(v.string(), v.null()),
  revisionNote: v.union(v.string(), v.null()),
  submittedAt: v.union(v.string(), v.null()),
  reviewedAt: v.union(v.string(), v.null()),
});

const labStepStatesValidator = v.object({
  registration: progressState,
  profile: progressState,
  interests: progressState,
  cv: progressState,
  linkedin: progressState,
  opportunities_10: progressState,
  motivation_letter: progressState,
  chosen_opportunity: progressState,
  application_submitted: progressState,
  proof_uploaded: progressState,
});

const certificateChecksValidator = v.object({
  profileComplete: v.boolean(),
  cvApproved: v.boolean(),
  linkedinPresent: v.boolean(),
  opportunitiesApproved: v.boolean(),
  chosenOpportunityApproved: v.boolean(),
  motivationApproved: v.boolean(),
  applicationApproved: v.boolean(),
  proofApproved: v.boolean(),
  attendancePassed: v.boolean(),
});

const participantStatus = v.union(
  v.literal("new_applicant"),
  v.literal("registered"),
  v.literal("onboarding_incomplete"),
  v.literal("active_participant"),
  v.literal("needs_reminder"),
  v.literal("strong_participant"),
  v.literal("application_submitted"),
  v.literal("completed"),
  v.literal("dropped")
);

const labProfileValidator = v.object({
  fullName: v.union(v.string(), v.null()),
  telegramUsername: v.union(v.string(), v.null()),
  cityOrDistrict: v.union(v.string(), v.null()),
  educationStatus: v.union(v.string(), v.null()),
  interests: v.array(v.string()),
  cvStatus: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("submitted"),
    v.literal("needs_revision"),
    v.literal("completed"),
    v.literal("help_requested")
  ),
  linkedinUrl: v.union(v.string(), v.null()),
  selectedOpportunityCount: v.number(),
  motivationLetterStatus: progressState,
  chosenOpportunityStatus: progressState,
  applicationProofStatus: progressState,
  attendancePercent: v.union(v.number(), v.null()),
  participantStatus: v.union(participantStatus, v.null()),
  mentorNotes: v.union(v.string(), v.null()),
});

const adminLabImportRowValidator = v.object({
  email: v.optional(v.string()),
  userId: v.optional(v.string()),
  fullName: v.optional(v.string()),
  telegramUsername: v.optional(v.string()),
  cityOrDistrict: v.optional(v.string()),
  educationStatus: v.optional(v.string()),
  interests: v.optional(v.array(v.string())),
  linkedinUrl: v.optional(v.string()),
  selectedOpportunityCount: v.optional(v.number()),
  attendancePercent: v.optional(v.number()),
  participantStatus: v.optional(participantStatus),
  cvStatus: v.optional(v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("submitted"),
    v.literal("needs_revision"),
    v.literal("completed"),
    v.literal("help_requested")
  )),
  motivationLetterStatus: v.optional(progressState),
  chosenOpportunityStatus: v.optional(progressState),
  applicationProofStatus: v.optional(progressState),
  mentorNotes: v.optional(v.string()),
});

const adminLabParticipantRowValidator = v.object({
  id: v.string(),
  userId: v.string(),
  email: v.union(v.string(), v.null()),
  fullName: v.union(v.string(), v.null()),
  telegramUsername: v.union(v.string(), v.null()),
  cityOrDistrict: v.union(v.string(), v.null()),
  educationStatus: v.union(v.string(), v.null()),
  interests: v.array(v.string()),
  selectedOpportunityCount: v.number(),
  attendancePercent: v.union(v.number(), v.null()),
  participantStatus: participantStatus,
  mentorNotes: v.union(v.string(), v.null()),
  progressPercent: v.number(),
  certificateEligible: v.boolean(),
  cvReview: mentorStatusValidator,
  motivationReview: mentorStatusValidator,
  proofReview: mentorStatusValidator,
  nextAction: v.string(),
  updatedAt: v.string(),
});

function normalizeState(done: boolean, explicit?: string): "not_started" | "in_progress" | "submitted" | "needs_revision" | "completed" {
  if (explicit === "needs_revision") return "needs_revision";
  if (explicit === "submitted") return "submitted";
  if (explicit === "completed" || done) return "completed";
  if (explicit === "in_progress") return "in_progress";
  return "not_started";
}

function taskState(task?: Doc<"labTasks"> | null): "not_started" | "in_progress" | "submitted" | "needs_revision" | "completed" {
  if (!task) return "not_started";
  if (task.mentorStatus === "approved") return "completed";
  if (task.mentorStatus === "needs_revision" || task.mentorStatus === "rejected") return "needs_revision";
  if (task.studentStatus === "submitted") return "submitted";
  if (task.studentStatus === "in_progress") return "in_progress";
  return "not_started";
}

function mapTaskReview(task: Doc<"labTasks">) {
  return {
    taskType: task.taskType,
    studentStatus: task.studentStatus,
    mentorStatus: task.mentorStatus,
    evidenceDocumentId: task.evidenceDocumentId ?? null,
    revisionNote: task.revisionNote ?? null,
    submittedAt: task.submittedAt ? new Date(task.submittedAt).toISOString() : null,
    reviewedAt: task.reviewedAt ? new Date(task.reviewedAt).toISOString() : null,
  };
}

function isApproved(task?: Doc<"labTasks"> | null) {
  return task?.mentorStatus === "approved";
}

function isSubmitted(task?: Doc<"labTasks"> | null) {
  return task?.studentStatus === "submitted" || task?.mentorStatus === "approved";
}

const CERTIFICATE_REQUIRED_CHECKS = [
  "profile_complete",
  "cv_approved",
  "linkedin_present",
  "opportunities_10_approved",
  "chosen_opportunity_approved",
  "motivation_letter_approved",
  "real_application_approved",
  "proof_approved",
  "attendance_70_percent",
];

function mapCertificateDecision(row: Doc<"labCertificateDecisions">) {
  return {
    id: row._id,
    userId: row.userId,
    cohortId: row.cohortId ?? null,
    status: row.status,
    policyVersion: row.policyVersion,
    requiredChecks: row.requiredChecks,
    blockedReasons: row.blockedReasons,
    decidedBy: row.decidedBy,
    decidedAt: new Date(row.decidedAt).toISOString(),
  };
}

async function mapCohortStats(ctx: { db: QueryCtx["db"] }, row: Doc<"labCohortStats">) {
  const cohort = await ctx.db.get(row.cohortId);
  return {
    cohortId: row.cohortId,
    cohortName: cohort?.name ?? "Lab cohort",
    cohortSlug: cohort?.slug ?? "",
    totalEnrollments: row.totalEnrollments,
    paidEnrollments: row.paidEnrollments,
    manualReviewEnrollments: row.manualReviewEnrollments,
    pendingPaymentEnrollments: row.pendingPaymentEnrollments,
    failedEnrollments: row.failedEnrollments,
    refundedEnrollments: row.refundedEnrollments,
    totalParticipants: row.totalParticipants,
    certificateReady: row.certificateReady,
    needsMentorReview: row.needsMentorReview,
    needsReminder: row.needsReminder,
    collectedUzs: row.collectedUzs,
    computedAt: new Date(row.computedAt).toISOString(),
  };
}

function documentTaskType(docType: string): LabTaskType | null {
  if (docType === "CV") return "cv";
  if (docType === "MOTIVATION_LETTER" || docType === "PROPOSAL_DRAFT") return "motivation_letter";
  if (docType === "APPLICATION_PROOF") return "proof_uploaded";
  return null;
}

async function findLatestEvidenceDocument(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  taskType: LabTaskType
) {
  const docs: Doc<"documents">[] = [];
  const activeDocs = await ctx.db
    .query("documents")
    .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
    .take(50);

  for (const doc of activeDocs) {
    if (documentTaskType(doc.docType) === taskType) docs.push(doc);
  }

  return docs.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

function nextAction(steps: Record<string, boolean>) {
  if (!steps.profile) {
    return {
      title: "Complete your profile",
      description: "Add your full name, city/district, Telegram username, education status, and basic interests so we can recommend relevant opportunities.",
      href: "/dashboard/lab",
      buttonLabel: "Complete profile",
      hint: "Profil maǵlıwmatlarıńızdı tolıqtırıń.",
    };
  }
  if (!steps.interests) {
    return {
      title: "Choose your interests",
      description: "Select grants, scholarships, forums, competitions, internships, volunteering, exchange programs, hackathons, or startup programs.",
      href: "/dashboard/lab",
      buttonLabel: "Select interests",
      hint: "Qızıǵıwshılıqlarıńızdı belgileń.",
    };
  }
  if (!steps.cv) {
    return {
      title: "Prepare your CV",
      description: "Upload your CV or mark that you need help creating one. A strong CV is required for most international opportunities.",
      href: "/dashboard/documents",
      buttonLabel: "Add CV status",
      hint: "CV tayarlań yamasa CV boyınsha járdem kerek ekenin belgileń.",
    };
  }
  if (!steps.linkedin) {
    return {
      title: "Improve your LinkedIn profile",
      description: "Add your LinkedIn link or create a profile. LinkedIn will help you find international programs and build your personal brand.",
      href: "/dashboard/lab",
      buttonLabel: "Add LinkedIn",
      hint: "LinkedIn profilińizdi qosıń.",
    };
  }
  if (!steps.opportunities_10) {
    return {
      title: "Find 10 opportunities",
      description: "Your first task is to find 10 relevant opportunities: grants, forums, scholarships, competitions, internships, or exchange programs.",
      href: "/dashboard/grants",
      buttonLabel: "Open opportunities",
      hint: "Ózińizge sáykes 10 imkaniyattı tańlań.",
    };
  }
  if (!steps.motivation_letter) {
    return {
      title: "Write your motivation letter",
      description: "Prepare a basic motivation letter that you can adapt for different programs.",
      href: "/dashboard/ai-writer",
      buttonLabel: "Submit motivation letter",
      hint: "Motivaciya xatıńızdı júkleń.",
    };
  }
  if (!steps.application_submitted || !steps.proof_uploaded) {
    return {
      title: "Submit your first real application",
      description: "Choose one real opportunity, prepare your answers, submit the application, and upload proof.",
      href: "/dashboard/tracker",
      buttonLabel: "Submit proof",
      hint: "Keminde 1 real arza tapsırıń.",
    };
  }
  return {
    title: "Certificate progress",
    description: "Sertifikat alıw ushın barlıq tiykarǵı tapsırmalardı tamamlań.",
    href: "/dashboard/documents",
    buttonLabel: "Review documents",
    hint: "Sertifikat alıw ushın barlıq tiykarǵı tapsırmalardı tamamlań.",
  };
}

async function computeLabStatus(ctx: { db: QueryCtx["db"] }, userId: Id<"users">) {
  const [lab, activeDocs, labTasks, saved, submittedApp, proposal, labApplications] = await Promise.all([
    ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
    ctx.db
      .query("documents")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .take(50),
    ctx.db
      .query("labTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20),
    ctx.db
      .query("savedGrants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(10),
    ctx.db
      .query("applications")
      .withIndex("by_user_and_status", (q) => q.eq("userId", userId).eq("status", "SUBMITTED"))
      .first(),
    ctx.db
      .query("proposalProjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
    ctx.db
      .query("labOpportunityApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20),
  ]);

  const docs = activeDocs as Doc<"documents">[];
  const tasksByType = new Map<LabTaskType, Doc<"labTasks">>();
  for (const task of labTasks) {
    tasksByType.set(task.taskType, task);
  }
  const cvTask = tasksByType.get("cv");
  const motivationTask = tasksByType.get("motivation_letter");
  const proofTask = tasksByType.get("proof_uploaded");
  const chosenTask = tasksByType.get("chosen_opportunity");
  const applicationTask = tasksByType.get("application_submitted");
  const opportunitiesTask = tasksByType.get("opportunities_10");
  const hasCv = docs.some((doc) => doc.docType === "CV");
  const hasMotivation = docs.some((doc) => doc.docType === "MOTIVATION_LETTER" || doc.docType === "PROPOSAL_DRAFT");
  const hasProof = docs.some((doc) => doc.docType === "APPLICATION_PROOF");
  const selectedOpportunityCount = Math.max(saved.length, lab?.selectedOpportunityCount ?? 0);
  const cvSubmitted = isSubmitted(cvTask) || hasCv || lab?.cvStatus === "submitted" || lab?.cvStatus === "help_requested";
  const motivationSubmitted = isSubmitted(motivationTask) || hasMotivation || !!proposal;
  const proofSubmitted = isSubmitted(proofTask) || hasProof;
  const labApplicationSubmitted = labApplications.some((row) =>
    row.status === "submitted" || row.status === "proof_uploaded" || row.status === "approved"
  );
  const labApplicationApproved = labApplications.some((row) => row.status === "approved");
  const cvApproved = isApproved(cvTask);
  const motivationApproved = isApproved(motivationTask);
  const proofApproved = isApproved(proofTask);
  const opportunitiesApproved = isApproved(opportunitiesTask);
  const applicationApproved = isApproved(applicationTask) || labApplicationApproved;
  const chosenOpportunityApproved =
    isApproved(chosenTask) ||
    labApplications.some((row) => row.status === "approved" || row.status === "proof_uploaded");
  const attendancePassed = typeof lab?.attendancePercent === "number" && lab.attendancePercent >= 70;

  const steps = {
    registration: true,
    profile: !!lab?.fullName,
    interests: (lab?.interests?.length ?? 0) > 0,
    cv: cvApproved,
    linkedin: !!lab?.linkedinUrl,
    opportunities_10: opportunitiesApproved,
    motivation_letter: motivationApproved,
    chosen_opportunity: chosenOpportunityApproved,
    application_submitted: applicationApproved,
    proof_uploaded: proofApproved,
  };

  const states = {
    registration: "completed" as const,
    profile: normalizeState(steps.profile),
    interests: normalizeState(steps.interests),
    cv: cvTask ? taskState(cvTask) : normalizeState(false, cvSubmitted ? "submitted" : undefined),
    linkedin: normalizeState(steps.linkedin),
    opportunities_10: opportunitiesTask
      ? taskState(opportunitiesTask)
      : normalizeState(opportunitiesApproved, selectedOpportunityCount > 0 ? "in_progress" : undefined),
    motivation_letter: motivationTask ? taskState(motivationTask) : normalizeState(false, motivationSubmitted ? "submitted" : undefined),
    chosen_opportunity: chosenTask
      ? taskState(chosenTask)
      : normalizeState(chosenOpportunityApproved, lab?.chosenOpportunityStatus),
    application_submitted: applicationTask
      ? taskState(applicationTask)
      : normalizeState(applicationApproved, submittedApp ? "submitted" : undefined),
    proof_uploaded: proofTask ? taskState(proofTask) : normalizeState(false, proofSubmitted ? "submitted" : undefined),
  };

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = 10;
  const certificateChecks = {
    profileComplete: steps.profile,
    cvApproved,
    linkedinPresent: steps.linkedin,
    opportunitiesApproved,
    chosenOpportunityApproved,
    motivationApproved,
    applicationApproved,
    proofApproved,
    attendancePassed,
  };
  const certificateEligible =
    certificateChecks.profileComplete &&
    certificateChecks.cvApproved &&
    certificateChecks.linkedinPresent &&
    certificateChecks.opportunitiesApproved &&
    certificateChecks.chosenOpportunityApproved &&
    certificateChecks.motivationApproved &&
    certificateChecks.applicationApproved &&
    certificateChecks.proofApproved &&
    certificateChecks.attendancePassed;

  const inferredStatus =
    certificateEligible ? "completed" :
    steps.application_submitted ? "application_submitted" :
    completedCount >= 7 ? "strong_participant" :
    completedCount >= 4 ? "active_participant" :
    completedCount >= 2 ? "onboarding_incomplete" :
    "registered";

  return {
    steps,
    stepStates: states,
    completedCount,
    totalSteps,
    progressPercent: Math.round((completedCount / totalSteps) * 100),
    isComplete: completedCount === totalSteps,
    selectedOpportunityCount,
    certificateEligible,
    certificateChecks,
    attendancePercent: lab?.attendancePercent ?? null,
    participantStatus: lab?.participantStatus ?? inferredStatus,
    mentorNotes: lab?.mentorNotes ?? null,
    taskReviews: labTasks.map(mapTaskReview),
    nextAction: nextAction(steps),
  };
}

type LabStatusSnapshot = Awaited<ReturnType<typeof computeLabStatus>>;

function buildCertificateBlockedReasons(status: LabStatusSnapshot) {
  const reasons: string[] = [];
  if (!status.certificateChecks.profileComplete) reasons.push("profile_incomplete");
  if (!status.certificateChecks.linkedinPresent) reasons.push("linkedin_missing");
  if (!status.certificateChecks.cvApproved) reasons.push("cv_not_approved");
  if (!status.certificateChecks.opportunitiesApproved) reasons.push("opportunities_10_not_approved");
  if (!status.certificateChecks.chosenOpportunityApproved) reasons.push("chosen_opportunity_not_approved");
  if (!status.certificateChecks.motivationApproved) reasons.push("motivation_letter_not_approved");
  if (!status.certificateChecks.applicationApproved) reasons.push("application_not_approved");
  if (!status.certificateChecks.proofApproved) reasons.push("proof_not_approved");
  if (!status.certificateChecks.attendancePassed) reasons.push("attendance_below_70");
  return reasons;
}

async function resolveCertificateCohort(ctx: { db: QueryCtx["db"] }, userId: Id<"users">) {
  const enrollment = await ctx.db
    .query("labEnrollments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();
  if (!enrollment) return null;
  return await ctx.db.get(enrollment.cohortId);
}

async function resolveAdminCohort(ctx: { db: QueryCtx["db"] }, cohortSlug?: string) {
  if (cohortSlug) {
    return await ctx.db
      .query("labCohorts")
      .withIndex("by_slug", (q) => q.eq("slug", cohortSlug))
      .unique();
  }

  const enrolling = await ctx.db
    .query("labCohorts")
    .withIndex("by_status", (q) => q.eq("status", "enrolling"))
    .first();
  if (enrolling) return enrolling;

  return await ctx.db
    .query("labCohorts")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .first();
}

async function findUserForAdminImport(
  ctx: Ctx,
  row: { userId?: string; email?: string }
) {
  if (row.userId) {
    const user = await getUserByExternalId(ctx, row.userId);
    if (user) return user;
  }

  const email = row.email?.trim();
  if (!email) return null;

  const exact = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  if (exact) return exact;

  const lower = email.toLowerCase();
  if (lower === email) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", lower))
    .first();
}

function cleanString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampPercent(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampOpportunityCount(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(50, Math.floor(value)));
}

function buildParticipantPatch(row: {
  fullName?: string;
  telegramUsername?: string;
  cityOrDistrict?: string;
  educationStatus?: string;
  interests?: string[];
  linkedinUrl?: string;
  selectedOpportunityCount?: number;
  attendancePercent?: number;
  participantStatus?: Doc<"labParticipants">["participantStatus"];
  cvStatus?: Doc<"labParticipants">["cvStatus"];
  motivationLetterStatus?: Doc<"labParticipants">["motivationLetterStatus"];
  chosenOpportunityStatus?: Doc<"labParticipants">["chosenOpportunityStatus"];
  applicationProofStatus?: Doc<"labParticipants">["applicationProofStatus"];
  mentorNotes?: string;
}) {
  const patch: Partial<Omit<Doc<"labParticipants">, "_id" | "_creationTime" | "userId" | "createdAt">> = {};
  if (row.fullName !== undefined) patch.fullName = cleanString(row.fullName);
  if (row.telegramUsername !== undefined) patch.telegramUsername = cleanString(row.telegramUsername);
  if (row.cityOrDistrict !== undefined) patch.cityOrDistrict = cleanString(row.cityOrDistrict);
  if (row.educationStatus !== undefined) patch.educationStatus = cleanString(row.educationStatus);
  if (row.interests !== undefined) patch.interests = row.interests.map((item) => item.trim()).filter(Boolean);
  if (row.linkedinUrl !== undefined) patch.linkedinUrl = cleanString(row.linkedinUrl);
  if (row.selectedOpportunityCount !== undefined) patch.selectedOpportunityCount = clampOpportunityCount(row.selectedOpportunityCount);
  if (row.attendancePercent !== undefined) patch.attendancePercent = clampPercent(row.attendancePercent);
  if (row.participantStatus !== undefined) patch.participantStatus = row.participantStatus;
  if (row.cvStatus !== undefined) patch.cvStatus = row.cvStatus;
  if (row.motivationLetterStatus !== undefined) patch.motivationLetterStatus = row.motivationLetterStatus;
  if (row.chosenOpportunityStatus !== undefined) patch.chosenOpportunityStatus = row.chosenOpportunityStatus;
  if (row.applicationProofStatus !== undefined) patch.applicationProofStatus = row.applicationProofStatus;
  if (row.mentorNotes !== undefined) patch.mentorNotes = cleanString(row.mentorNotes);
  return patch;
}

async function mapAdminParticipant(ctx: { db: QueryCtx["db"] }, lab: Doc<"labParticipants">) {
  const [user, status] = await Promise.all([
    ctx.db.get(lab.userId),
    computeLabStatus(ctx, lab.userId),
  ]);

  return {
    id: lab._id,
    userId: user ? externalUserId(user) : lab.userId,
    email: user?.email ?? null,
    fullName: lab.fullName ?? null,
    telegramUsername: lab.telegramUsername ?? null,
    cityOrDistrict: lab.cityOrDistrict ?? null,
    educationStatus: lab.educationStatus ?? null,
    interests: lab.interests ?? [],
    selectedOpportunityCount: status.selectedOpportunityCount,
    attendancePercent: status.attendancePercent,
    participantStatus: status.participantStatus,
    mentorNotes: status.mentorNotes,
    progressPercent: status.progressPercent,
    certificateEligible: status.certificateEligible,
    cvReview: status.taskReviews.find((task) => task.taskType === "cv")?.mentorStatus ?? "pending_review",
    motivationReview: status.taskReviews.find((task) => task.taskType === "motivation_letter")?.mentorStatus ?? "pending_review",
    proofReview: status.taskReviews.find((task) => task.taskType === "proof_uploaded")?.mentorStatus ?? "pending_review",
    nextAction: status.nextAction.title,
    updatedAt: new Date(lab.updatedAt).toISOString(),
  };
}

export const getStatus = authedQuery({
  args: {},
  returns: v.object({
    steps: labStepsValidator,
    stepStates: labStepStatesValidator,
    completedCount: v.number(),
    totalSteps: v.number(),
    progressPercent: v.number(),
    isComplete: v.boolean(),
    selectedOpportunityCount: v.number(),
    certificateEligible: v.boolean(),
    certificateChecks: certificateChecksValidator,
    attendancePercent: v.union(v.number(), v.null()),
    participantStatus,
    mentorNotes: v.union(v.string(), v.null()),
    taskReviews: v.array(taskReviewValidator),
    nextAction: v.object({
      title: v.string(),
      description: v.string(),
      href: v.string(),
      buttonLabel: v.string(),
      hint: v.string(),
    }),
  }),
  handler: async (ctx) => {
    return await computeLabStatus(ctx, ctx.user._id);
  },
});

export const getLabProfile = authedQuery({
  args: {},
  returns: labProfileValidator,
  handler: async (ctx) => {
    const lab = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    return {
      fullName: lab?.fullName ?? null,
      telegramUsername: lab?.telegramUsername ?? null,
      cityOrDistrict: lab?.cityOrDistrict ?? null,
      educationStatus: lab?.educationStatus ?? null,
      interests: lab?.interests ?? [],
      cvStatus: lab?.cvStatus ?? "not_started",
      linkedinUrl: lab?.linkedinUrl ?? null,
      selectedOpportunityCount: lab?.selectedOpportunityCount ?? 0,
      motivationLetterStatus: lab?.motivationLetterStatus ?? "not_started",
      chosenOpportunityStatus: lab?.chosenOpportunityStatus ?? "not_started",
      applicationProofStatus: lab?.applicationProofStatus ?? "not_started",
      attendancePercent: lab?.attendancePercent ?? null,
      participantStatus: lab?.participantStatus ?? null,
      mentorNotes: lab?.mentorNotes ?? null,
    };
  },
});

export const updateLabProfile = authedMutation({
  args: {
    fullName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    cityOrDistrict: v.optional(v.string()),
    educationStatus: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    cvStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("needs_revision"),
      v.literal("completed"),
      v.literal("help_requested")
    )),
    linkedinUrl: v.optional(v.string()),
    selectedOpportunityCount: v.optional(v.number()),
  },
  returns: labProfileValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    const now = Date.now();
    const patch: Partial<Omit<Doc<"labParticipants">, "_id" | "_creationTime" | "userId" | "createdAt">> = {
      updatedAt: now,
    };
    if (args.fullName !== undefined) patch.fullName = args.fullName;
    if (args.telegramUsername !== undefined) patch.telegramUsername = args.telegramUsername;
    if (args.cityOrDistrict !== undefined) patch.cityOrDistrict = args.cityOrDistrict;
    if (args.educationStatus !== undefined) patch.educationStatus = args.educationStatus;
    if (args.interests !== undefined) patch.interests = args.interests;
    if (args.cvStatus !== undefined) patch.cvStatus = args.cvStatus;
    if (args.linkedinUrl !== undefined) patch.linkedinUrl = args.linkedinUrl;
    if (args.selectedOpportunityCount !== undefined) {
      patch.selectedOpportunityCount = Math.max(0, Math.min(10, Math.floor(args.selectedOpportunityCount)));
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

    await patchUserMode(ctx, ctx.user._id, "individual");

    const saved = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .first();

    return {
      fullName: saved?.fullName ?? null,
      telegramUsername: saved?.telegramUsername ?? null,
      cityOrDistrict: saved?.cityOrDistrict ?? null,
      educationStatus: saved?.educationStatus ?? null,
      interests: saved?.interests ?? [],
      cvStatus: saved?.cvStatus ?? "not_started",
      linkedinUrl: saved?.linkedinUrl ?? null,
      selectedOpportunityCount: saved?.selectedOpportunityCount ?? 0,
      motivationLetterStatus: saved?.motivationLetterStatus ?? "not_started",
      chosenOpportunityStatus: saved?.chosenOpportunityStatus ?? "not_started",
      applicationProofStatus: saved?.applicationProofStatus ?? "not_started",
      attendancePercent: saved?.attendancePercent ?? null,
      participantStatus: saved?.participantStatus ?? null,
      mentorNotes: saved?.mentorNotes ?? null,
    };
  },
});

export const submitTask = authedMutation({
  args: {
    taskType: labTaskType,
    evidenceDocumentId: v.optional(v.id("documents")),
  },
  returns: taskReviewValidator,
  handler: async (ctx, args) => {
    let evidenceDocumentId = args.evidenceDocumentId;

    if (evidenceDocumentId) {
      const doc = await ctx.db.get(evidenceDocumentId);
      if (!doc || doc.userId !== ctx.user._id || doc.status !== "active") {
        throw new Error("Evidence document not found");
      }
    } else {
      const latestDoc = await findLatestEvidenceDocument(ctx, ctx.user._id, args.taskType);
      evidenceDocumentId = latestDoc?._id;
    }

    const now = Date.now();
    const cohortId = await resolveLabCohortId(ctx, ctx.user._id);
    const existing = await ctx.db
      .query("labTasks")
      .withIndex("by_user_and_taskType", (q) =>
        q.eq("userId", ctx.user._id).eq("taskType", args.taskType)
      )
      .first();

    const patch: Partial<Omit<Doc<"labTasks">, "_id" | "_creationTime" | "userId" | "taskType" | "createdAt">> = {
      cohortId,
      studentStatus: "submitted",
      mentorStatus: "pending_review",
      evidenceDocumentId,
      submittedAt: now,
      updatedAt: now,
      reviewedAt: undefined,
      reviewedBy: undefined,
      revisionNote: undefined,
    };

    if (existing) {
      await ctx.db.patch("labTasks", existing._id, patch);
    } else {
      await ctx.db.insert("labTasks", {
        userId: ctx.user._id,
        cohortId,
        taskType: args.taskType,
        studentStatus: "submitted",
        mentorStatus: "pending_review",
        evidenceDocumentId,
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const task = await ctx.db
      .query("labTasks")
      .withIndex("by_user_and_taskType", (q) =>
        q.eq("userId", ctx.user._id).eq("taskType", args.taskType)
      )
      .first();

    if (!task) throw new Error("Task submit failed");
    return mapTaskReview(task);
  },
});

export const reviewTask = adminMutation({
  args: {
    userId: v.string(),
    taskType: labTaskType,
    mentorStatus: mentorStatusValidator,
    revisionNote: v.optional(v.string()),
  },
  returns: taskReviewValidator,
  handler: async (ctx, args) => {
    const participant = await getUserByExternalId(ctx, args.userId);
    if (!participant) throw new Error("Participant not found");

    const now = Date.now();
    const existing = await ctx.db
      .query("labTasks")
      .withIndex("by_user_and_taskType", (q) =>
        q.eq("userId", participant._id).eq("taskType", args.taskType)
      )
      .first();

    const cohortId = await resolveLabCohortId(ctx, participant._id);
    const studentStatus = args.mentorStatus === "approved" ? "submitted" : existing?.studentStatus ?? "submitted";
    const patch: Partial<Omit<Doc<"labTasks">, "_id" | "_creationTime" | "userId" | "taskType" | "createdAt">> = {
      cohortId,
      studentStatus,
      mentorStatus: args.mentorStatus,
      reviewedAt: now,
      reviewedBy: ctx.user._id,
      revisionNote: args.revisionNote,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch("labTasks", existing._id, patch);
    } else {
      await ctx.db.insert("labTasks", {
        userId: participant._id,
        cohortId,
        taskType: args.taskType,
        studentStatus,
        mentorStatus: args.mentorStatus,
        reviewedAt: now,
        reviewedBy: ctx.user._id,
        revisionNote: args.revisionNote,
        createdAt: now,
        updatedAt: now,
      });
    }

    const task = await ctx.db
      .query("labTasks")
      .withIndex("by_user_and_taskType", (q) =>
        q.eq("userId", participant._id).eq("taskType", args.taskType)
      )
      .first();

    if (!task) throw new Error("Task review failed");
    return mapTaskReview(task);
  },
});

export const issueCertificateDecision = adminMutation({
  args: { userId: v.string() },
  returns: certificateDecisionValidator,
  handler: async (ctx, args) => {
    const participant = await getUserByExternalId(ctx, args.userId);
    if (!participant) throw new Error("Participant not found");

    const existingIssued = await ctx.db
      .query("labCertificateDecisions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", participant._id).eq("status", "issued")
      )
      .order("desc")
      .first();
    if (existingIssued) return mapCertificateDecision(existingIssued);

    const [status, cohort] = await Promise.all([
      computeLabStatus(ctx, participant._id),
      resolveCertificateCohort(ctx, participant._id),
    ]);
    const blockedReasons = buildCertificateBlockedReasons(status);
    const decisionStatus: CertificateDecisionStatus =
      status.certificateEligible && blockedReasons.length === 0 ? "issued" : "blocked";
    const now = Date.now();

    const decisionId = await ctx.db.insert("labCertificateDecisions", {
      userId: participant._id,
      cohortId: cohort?._id,
      status: decisionStatus,
      policyVersion: cohort?.certificatePolicyVersion ?? "lab-v1",
      requiredChecks: CERTIFICATE_REQUIRED_CHECKS,
      blockedReasons,
      decidedBy: ctx.user._id,
      decidedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const decision = await ctx.db.get(decisionId);
    if (!decision) throw new Error("Certificate decision failed");
    return mapCertificateDecision(decision);
  },
});

export const getMyLatestCertificateDecision = authedQuery({
  args: {},
  returns: v.union(certificateDecisionValidator, v.null()),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("labCertificateDecisions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .first();
    return row ? mapCertificateDecision(row) : null;
  },
});

export const recomputeCohortStatsForAdmin = adminMutation({
  args: { cohortSlug: v.optional(v.string()) },
  returns: labCohortStatsValidator,
  handler: async (ctx, args) => {
    const cohort = await resolveAdminCohort(ctx, args.cohortSlug);
    if (!cohort) throw new Error("Lab cohort not found");

    const enrollments = await ctx.db
      .query("labEnrollments")
      .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
      .take(1000);

    let totalParticipants = 0;
    let certificateReady = 0;
    let needsMentorReview = 0;
    let needsReminder = 0;
    let collectedUzs = 0;
    let paidEnrollments = 0;
    let manualReviewEnrollments = 0;
    let pendingPaymentEnrollments = 0;
    let failedEnrollments = 0;
    let refundedEnrollments = 0;

    for (const enrollment of enrollments) {
      if (enrollment.status === "paid") {
        paidEnrollments += 1;
        collectedUzs += enrollment.amountUzs;
      } else if (enrollment.status === "manual_review") {
        manualReviewEnrollments += 1;
      } else if (enrollment.status === "pending_payment") {
        pendingPaymentEnrollments += 1;
      } else if (enrollment.status === "failed") {
        failedEnrollments += 1;
      } else if (enrollment.status === "refunded") {
        refundedEnrollments += 1;
      }

      const participant = await ctx.db
        .query("labParticipants")
        .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
        .first();
      if (!participant) continue;

      totalParticipants += 1;
      const status = await computeLabStatus(ctx, enrollment.userId);
      if (status.certificateEligible) certificateReady += 1;
      if (status.participantStatus === "needs_reminder") needsReminder += 1;
      const hasPendingReview = status.taskReviews.some((task) =>
        task.mentorStatus === "pending_review" || task.mentorStatus === "needs_revision"
      );
      if (hasPendingReview) needsMentorReview += 1;
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("labCohortStats")
      .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
      .unique();
    const data = {
      cohortId: cohort._id,
      totalEnrollments: enrollments.length,
      paidEnrollments,
      manualReviewEnrollments,
      pendingPaymentEnrollments,
      failedEnrollments,
      refundedEnrollments,
      totalParticipants,
      certificateReady,
      needsMentorReview,
      needsReminder,
      collectedUzs,
      computedAt: now,
      updatedAt: now,
    };

    let statsId: Id<"labCohortStats">;
    if (existing) {
      await ctx.db.patch(existing._id, data);
      statsId = existing._id;
    } else {
      statsId = await ctx.db.insert("labCohortStats", {
        ...data,
        createdAt: now,
      });
    }

    const stats = await ctx.db.get(statsId);
    if (!stats) throw new Error("Failed to recompute cohort stats");
    return await mapCohortStats(ctx, stats);
  },
});

export const getCohortStatsForAdmin = adminQuery({
  args: { cohortSlug: v.optional(v.string()) },
  returns: v.union(labCohortStatsValidator, v.null()),
  handler: async (ctx, args) => {
    const cohort = await resolveAdminCohort(ctx, args.cohortSlug);
    if (!cohort) return null;
    const stats = await ctx.db
      .query("labCohortStats")
      .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
      .unique();
    return stats ? await mapCohortStats(ctx, stats) : null;
  },
});

export const listJourneyForAdmin = adminQuery({
  args: { limit: v.number() },
  returns: v.object({
    participants: v.array(v.object({
      id: v.string(),
      email: v.union(v.string(), v.null()),
      fullName: v.union(v.string(), v.null()),
      telegramUsername: v.union(v.string(), v.null()),
      status: participantStatus,
      progressPercent: v.number(),
      profile: v.boolean(),
      interests: v.boolean(),
      cv: v.boolean(),
      linkedin: v.boolean(),
      opportunities10: v.boolean(),
      motivationLetter: v.boolean(),
      applicationSubmitted: v.boolean(),
      certificateEligible: v.boolean(),
      cvReview: mentorStatusValidator,
      motivationReview: mentorStatusValidator,
      proofReview: mentorStatusValidator,
      notes: v.union(v.string(), v.null()),
      nextAction: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit, 1), 100);
    const enrollments = await ctx.db
      .query("labEnrollments")
      .order("desc")
      .take(limit);

    const participants = await Promise.all(enrollments.map(async (enrollment) => {
      const user = await ctx.db.get(enrollment.userId);
      if (!user) return null;

      const [lab, status] = await Promise.all([
        ctx.db
          .query("labParticipants")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first(),
        computeLabStatus(ctx, user._id),
      ]);

      return {
        id: externalUserId(user),
        email: user.email ?? null,
        fullName: lab?.fullName ?? null,
        telegramUsername: lab?.telegramUsername ?? null,
        status: status.participantStatus,
        progressPercent: status.progressPercent,
        profile: status.steps.profile,
        interests: status.steps.interests,
        cv: status.steps.cv,
        linkedin: status.steps.linkedin,
        opportunities10: status.steps.opportunities_10,
        motivationLetter: status.steps.motivation_letter,
        applicationSubmitted: status.steps.application_submitted,
        certificateEligible: status.certificateEligible,
        cvReview: status.taskReviews.find((task) => task.taskType === "cv")?.mentorStatus ?? "pending_review",
        motivationReview: status.taskReviews.find((task) => task.taskType === "motivation_letter")?.mentorStatus ?? "pending_review",
        proofReview: status.taskReviews.find((task) => task.taskType === "proof_uploaded")?.mentorStatus ?? "pending_review",
        notes: status.mentorNotes,
        nextAction: status.nextAction.title,
      };
    }));

    return { participants: participants.filter((row) => row !== null) };
  },
});

export const listParticipantsForAdmin = adminQuery({
  args: { limit: v.number(), cohortSlug: v.optional(v.string()) },
  returns: v.object({
    participants: v.array(adminLabParticipantRowValidator),
    cohortStats: v.union(labCohortStatsValidator, v.null()),
    summary: v.object({
      total: v.number(),
      returnedCount: v.number(),
      limit: v.number(),
      scope: v.literal("visible_window"),
      isPossiblyPartial: v.boolean(),
      certificateReady: v.number(),
      needsMentorReview: v.number(),
      needsReminder: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit, 1), 200);
    const cohort = await resolveAdminCohort(ctx, args.cohortSlug);
    const stats = cohort
      ? await ctx.db
          .query("labCohortStats")
          .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
          .unique()
      : null;
    const rows = await ctx.db
      .query("labParticipants")
      .order("desc")
      .take(limit);

    const participants = await Promise.all(rows.map((row) => mapAdminParticipant(ctx, row)));
    return {
      participants,
      cohortStats: stats ? await mapCohortStats(ctx, stats) : null,
      summary: {
        total: participants.length,
        returnedCount: participants.length,
        limit,
        scope: "visible_window" as const,
        isPossiblyPartial: participants.length === limit,
        certificateReady: participants.filter((row) => row.certificateEligible).length,
        needsMentorReview: participants.filter((row) =>
          row.cvReview === "pending_review" ||
          row.motivationReview === "pending_review" ||
          row.proofReview === "pending_review"
        ).length,
        needsReminder: participants.filter((row) => row.participantStatus === "needs_reminder").length,
      },
    };
  },
});

export const importParticipantsForAdmin = adminMutation({
  args: { rows: v.array(adminLabImportRowValidator) },
  returns: v.object({
    imported: v.number(),
    updated: v.number(),
    created: v.number(),
    unmatched: v.array(v.object({
      rowNumber: v.number(),
      email: v.union(v.string(), v.null()),
      fullName: v.union(v.string(), v.null()),
      reason: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const rows = args.rows.slice(0, 200);
    const now = Date.now();
    let updated = 0;
    let created = 0;
    const unmatched: Array<{ rowNumber: number; email: string | null; fullName: string | null; reason: string }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const user = await findUserForAdminImport(ctx, row);
      if (!user) {
        unmatched.push({
          rowNumber: index + 1,
          email: row.email?.trim() || null,
          fullName: row.fullName?.trim() || null,
          reason: "No FundingPro user matched this email/user id",
        });
        continue;
      }

      const patch = buildParticipantPatch(row);
      const existing = await ctx.db
        .query("labParticipants")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { ...patch, updatedAt: now });
        updated += 1;
      } else {
        await ctx.db.insert("labParticipants", {
          userId: user._id,
          ...patch,
          participantStatus: patch.participantStatus ?? "registered",
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    }

    return {
      imported: updated + created,
      updated,
      created,
      unmatched,
    };
  },
});

export const updateParticipantForAdmin = adminMutation({
  args: {
    userId: v.string(),
    fullName: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    cityOrDistrict: v.optional(v.string()),
    educationStatus: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    linkedinUrl: v.optional(v.string()),
    selectedOpportunityCount: v.optional(v.number()),
    attendancePercent: v.optional(v.number()),
    participantStatus: v.optional(participantStatus),
    cvStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("needs_revision"),
      v.literal("completed"),
      v.literal("help_requested")
    )),
    motivationLetterStatus: v.optional(progressState),
    chosenOpportunityStatus: v.optional(progressState),
    applicationProofStatus: v.optional(progressState),
    mentorNotes: v.optional(v.string()),
  },
  returns: adminLabParticipantRowValidator,
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.userId);
    if (!user) throw new Error("Participant not found");

    const now = Date.now();
    const patch = buildParticipantPatch(args);
    const existing = await ctx.db
      .query("labParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    let id: Id<"labParticipants">;
    if (existing) {
      await ctx.db.patch(existing._id, { ...patch, updatedAt: now });
      id = existing._id;
    } else {
      id = await ctx.db.insert("labParticipants", {
        userId: user._id,
        ...patch,
        participantStatus: patch.participantStatus ?? "registered",
        createdAt: now,
        updatedAt: now,
      });
    }

    const saved = await ctx.db.get(id);
    if (!saved) throw new Error("Participant update failed");
    return await mapAdminParticipant(ctx, saved);
  },
});
