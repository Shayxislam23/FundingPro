import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import type { Id } from "../../convex/_generated/dataModel";

export type LabEnrollmentStatus =
  | "pending_payment"
  | "manual_review"
  | "paid"
  | "failed"
  | "refunded";

export type LabCohort = {
  id: string | null;
  slug: string;
  name: string;
  startsAt: string;
  firstLessonAt: string | null;
  firstLessonUrl: string | null;
  priceUzs: number;
  status: string;
};

export type LabEnrollment = {
  id: string;
  status: LabEnrollmentStatus;
  amountUzs: number;
  manualProofDocumentId: string | null;
  paidAt: string | null;
  reviewedAt: string | null;
  notes: string | null;
};

export type LabAccess = {
  cohort: LabCohort;
  enrollment: LabEnrollment | null;
  hasPaidAccess: boolean;
  accessState: LabEnrollmentStatus | "not_enrolled";
  nextAction: {
    kind: "enroll" | "pay" | "await_manual_review" | "open_lab" | "contact_support";
    label: string;
    href: string;
    tone: "primary" | "warning" | "success" | "danger";
    description: string;
  };
};

export type LabPaymePayment = {
  paymentId: string;
  amountUzs: number;
  amountTiyin: number;
  cohort: LabCohort;
  enrollment: LabEnrollment;
};

export type AdminLabEnrollment = LabEnrollment & {
  userId: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  cohortName: string;
};

export type LabSubmissionMethod =
  | "google_form"
  | "email"
  | "external_portal"
  | "pdf_upload"
  | "other";

export type LabApplicationStatus =
  | "planned"
  | "preparing"
  | "submitted"
  | "proof_uploaded"
  | "approved"
  | "needs_revision"
  | "rejected";

export type LabOpportunityApplication = {
  id: string;
  title: string;
  opportunityUrl: string | null;
  submissionMethod: LabSubmissionMethod;
  status: LabApplicationStatus;
  proofDocumentId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  mentorNotes: string | null;
};

export type LabParticipantStatus =
  | "new_applicant"
  | "registered"
  | "onboarding_incomplete"
  | "active_participant"
  | "needs_reminder"
  | "strong_participant"
  | "application_submitted"
  | "completed"
  | "dropped";

export type LabProgressState =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "needs_revision"
  | "completed";

export type LabCvStatus = LabProgressState | "help_requested";

export type MentorReviewStatus =
  | "pending_review"
  | "needs_revision"
  | "approved"
  | "rejected";

export type AdminLabParticipantImportRow = {
  email?: string;
  userId?: string;
  fullName?: string;
  telegramUsername?: string;
  cityOrDistrict?: string;
  educationStatus?: string;
  interests?: string[];
  linkedinUrl?: string;
  selectedOpportunityCount?: number;
  attendancePercent?: number;
  participantStatus?: LabParticipantStatus;
  cvStatus?: LabCvStatus;
  motivationLetterStatus?: LabProgressState;
  chosenOpportunityStatus?: LabProgressState;
  applicationProofStatus?: LabProgressState;
  mentorNotes?: string;
};

export type AdminLabParticipant = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  cityOrDistrict: string | null;
  educationStatus: string | null;
  interests: string[];
  selectedOpportunityCount: number;
  attendancePercent: number | null;
  participantStatus: LabParticipantStatus;
  mentorNotes: string | null;
  progressPercent: number;
  certificateEligible: boolean;
  cvReview: MentorReviewStatus;
  motivationReview: MentorReviewStatus;
  proofReview: MentorReviewStatus;
  nextAction: string;
  updatedAt: string;
};

export type LabCohortStats = {
  cohortId: string;
  cohortName: string;
  cohortSlug: string;
  totalEnrollments: number;
  paidEnrollments: number;
  manualReviewEnrollments: number;
  pendingPaymentEnrollments: number;
  failedEnrollments: number;
  refundedEnrollments: number;
  totalParticipants: number;
  certificateReady: number;
  needsMentorReview: number;
  needsReminder: number;
  collectedUzs: number;
  computedAt: string;
};

export async function getLabAccess(accessToken: string): Promise<LabAccess> {
  return convexQuery(api.lab.getMyAccess, {}, accessToken);
}

export async function ensureLabEnrollment(accessToken: string): Promise<LabAccess> {
  return convexMutation(api.lab.ensureMyEnrollment, {}, accessToken);
}

export async function createLabPaymePayment(accessToken: string): Promise<LabPaymePayment> {
  return convexMutation(api.lab.createMyPaymePayment, {}, accessToken);
}

export async function submitLabPaymentProof(
  documentId: string,
  accessToken: string
): Promise<LabAccess> {
  return convexMutation(
    api.lab.submitManualPaymentProof,
    { documentId: documentId as Id<"documents"> },
    accessToken
  );
}

export async function listLabEnrollmentsForAdmin(
  opts: { limit: number },
  accessToken: string
): Promise<{ enrollments: AdminLabEnrollment[] }> {
  return convexQuery(api.lab.listEnrollmentsForAdmin, opts, accessToken);
}

export async function markLabEnrollmentStatus(
  params: {
    enrollmentId: string;
    status: LabEnrollmentStatus;
    notes?: string;
  },
  accessToken: string
): Promise<LabEnrollment> {
  return convexMutation(
    api.lab.markEnrollmentStatus,
    {
      enrollmentId: params.enrollmentId as Id<"labEnrollments">,
      status: params.status,
      notes: params.notes,
    },
    accessToken
  );
}

export async function listMyLabApplications(accessToken: string): Promise<LabOpportunityApplication[]> {
  return convexQuery(api.lab.listMyApplications, {}, accessToken);
}

export async function upsertMyLabApplication(
  params: {
    applicationId?: string;
    title: string;
    opportunityUrl?: string;
    submissionMethod: LabSubmissionMethod;
    status?: LabApplicationStatus;
    proofDocumentId?: string;
  },
  accessToken: string
): Promise<LabOpportunityApplication> {
  return convexMutation(
    api.lab.upsertMyApplication,
    {
      applicationId: params.applicationId as Id<"labOpportunityApplications"> | undefined,
      title: params.title,
      opportunityUrl: params.opportunityUrl,
      submissionMethod: params.submissionMethod,
      status: params.status,
      proofDocumentId: params.proofDocumentId as Id<"documents"> | undefined,
    },
    accessToken
  );
}

export async function listLabParticipantsForAdmin(
  opts: { limit: number; cohortSlug?: string },
  accessToken: string
): Promise<{
  participants: AdminLabParticipant[];
  cohortStats: LabCohortStats | null;
  summary: {
    total: number;
    returnedCount: number;
    limit: number;
    scope: "visible_window";
    isPossiblyPartial: boolean;
    certificateReady: number;
    needsMentorReview: number;
    needsReminder: number;
  };
}> {
  return convexQuery(api.onboarding.listParticipantsForAdmin, opts, accessToken);
}

export async function recomputeLabCohortStatsForAdmin(
  opts: { cohortSlug?: string },
  accessToken: string
): Promise<LabCohortStats> {
  return convexMutation(api.onboarding.recomputeCohortStatsForAdmin, opts, accessToken);
}

export async function importLabParticipantsForAdmin(
  rows: AdminLabParticipantImportRow[],
  accessToken: string
): Promise<{
  imported: number;
  updated: number;
  created: number;
  unmatched: { rowNumber: number; email: string | null; fullName: string | null; reason: string }[];
}> {
  return convexMutation(api.onboarding.importParticipantsForAdmin, { rows }, accessToken);
}

export async function updateLabParticipantForAdmin(
  params: AdminLabParticipantImportRow & { userId: string },
  accessToken: string
): Promise<AdminLabParticipant> {
  return convexMutation(api.onboarding.updateParticipantForAdmin, params, accessToken);
}
