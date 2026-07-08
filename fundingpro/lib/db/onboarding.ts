import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import type { Id } from "../../convex/_generated/dataModel";

export type OnboardingStepId =
  | "registration"
  | "profile"
  | "interests"
  | "cv"
  | "linkedin"
  | "opportunities_10"
  | "motivation_letter"
  | "chosen_opportunity"
  | "application_submitted"
  | "proof_uploaded";

export type OnboardingProgressState =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "needs_revision"
  | "completed";

export type LabTaskType =
  | "profile"
  | "interests"
  | "cv"
  | "linkedin"
  | "opportunities_10"
  | "motivation_letter"
  | "chosen_opportunity"
  | "application_submitted"
  | "proof_uploaded";

export type MentorReviewStatus =
  | "pending_review"
  | "needs_revision"
  | "approved"
  | "rejected";

export type LabTaskReview = {
  taskType: LabTaskType;
  studentStatus: "not_started" | "in_progress" | "submitted";
  mentorStatus: MentorReviewStatus;
  evidenceDocumentId: string | null;
  revisionNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type OnboardingStatus = {
  steps: Record<OnboardingStepId, boolean>;
  stepStates: Record<OnboardingStepId, OnboardingProgressState>;
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  isComplete: boolean;
  selectedOpportunityCount: number;
  certificateEligible: boolean;
  attendancePercent: number | null;
  participantStatus:
    | "new_applicant"
    | "registered"
    | "onboarding_incomplete"
    | "active_participant"
    | "needs_reminder"
    | "strong_participant"
    | "application_submitted"
    | "completed"
    | "dropped";
  mentorNotes: string | null;
  taskReviews: LabTaskReview[];
  nextAction: {
    title: string;
    description: string;
    href: string;
    buttonLabel: string;
    hint: string;
  };
};

export async function getOnboardingStatus(accessToken: string): Promise<OnboardingStatus> {
  return convexQuery(api.onboarding.getStatus, {}, accessToken);
}

export type LabProfile = {
  fullName: string | null;
  telegramUsername: string | null;
  cityOrDistrict: string | null;
  educationStatus: string | null;
  interests: string[];
  cvStatus: OnboardingProgressState | "help_requested";
  linkedinUrl: string | null;
  selectedOpportunityCount: number;
  motivationLetterStatus: OnboardingProgressState;
  chosenOpportunityStatus: OnboardingProgressState;
  applicationProofStatus: OnboardingProgressState;
  attendancePercent: number | null;
  participantStatus: OnboardingStatus["participantStatus"] | null;
  mentorNotes: string | null;
};

export async function getLabProfile(accessToken: string): Promise<LabProfile> {
  return convexQuery(api.onboarding.getLabProfile, {}, accessToken);
}

export async function updateLabProfile(
  params: Partial<Pick<
    LabProfile,
    | "fullName"
    | "telegramUsername"
    | "cityOrDistrict"
    | "educationStatus"
    | "interests"
    | "cvStatus"
    | "linkedinUrl"
    | "selectedOpportunityCount"
  >>,
  accessToken: string
): Promise<LabProfile> {
  return convexMutation(api.onboarding.updateLabProfile, {
    ...params,
    fullName: params.fullName ?? undefined,
    telegramUsername: params.telegramUsername ?? undefined,
    cityOrDistrict: params.cityOrDistrict ?? undefined,
    educationStatus: params.educationStatus ?? undefined,
    linkedinUrl: params.linkedinUrl ?? undefined,
  }, accessToken);
}

export async function submitLabTask(
  params: {
    taskType: LabTaskType;
    evidenceDocumentId?: string;
  },
  accessToken: string
): Promise<LabTaskReview> {
  return convexMutation(
    api.onboarding.submitTask,
    {
      taskType: params.taskType,
      evidenceDocumentId: params.evidenceDocumentId as Id<"documents"> | undefined,
    },
    accessToken
  );
}

export async function reviewLabTask(
  params: {
    userId: string;
    taskType: LabTaskType;
    mentorStatus: MentorReviewStatus;
    revisionNote?: string;
  },
  accessToken: string
): Promise<LabTaskReview> {
  return convexMutation(api.onboarding.reviewTask, params, accessToken);
}
