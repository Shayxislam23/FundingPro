import type { LabJourney } from "@fundingpro/api-types";
import type { LabProfile, OnboardingProgressState, OnboardingStatus } from "@/lib/db/onboarding";

/** Mobile / shared UI step ids → Convex onboarding step ids */
const UI_TO_BACKEND: Record<string, keyof OnboardingStatus["stepStates"]> = {
  registration: "registration",
  profile: "profile",
  interests: "interests",
  cv: "cv",
  linkedin: "linkedin",
  opportunities: "opportunities_10",
  motivation: "motivation_letter",
  chosen: "chosen_opportunity",
  application: "application_submitted",
  proof: "proof_uploaded",
};

const UI_STEP_ORDER = Object.keys(UI_TO_BACKEND);

const OPPORTUNITIES_TARGET = 10;

function isDone(state: OnboardingProgressState): boolean {
  return state === "submitted" || state === "completed";
}

function mapProfile(profile: LabProfile): LabJourney["profile"] {
  return {
    fullName: profile.fullName,
    age: null,
    city: profile.cityOrDistrict,
    telegram: profile.telegramUsername,
    educationStatus: profile.educationStatus,
    interests: profile.interests,
    cvStatus: profile.cvStatus,
    linkedinUrl: profile.linkedinUrl,
    motivationLetterStatus: profile.motivationLetterStatus,
    chosenGrantId: null,
    applicationProofStatus: profile.applicationProofStatus,
  };
}

function mapCertificate(status: OnboardingStatus): LabJourney["certificate"] {
  const checks = (status as OnboardingStatus & {
    certificateChecks?: {
      profileComplete: boolean;
      cvApproved: boolean;
      linkedinPresent: boolean;
      opportunitiesApproved: boolean;
      motivationApproved: boolean;
      applicationApproved: boolean;
      attendancePassed: boolean;
    };
  }).certificateChecks;

  const requirements = [
    { id: "profile", done: checks?.profileComplete ?? !!status.steps.profile },
    { id: "cv", done: checks?.cvApproved ?? isDone(status.stepStates.cv) },
    { id: "motivation", done: checks?.motivationApproved ?? isDone(status.stepStates.motivation_letter) },
    { id: "linkedin", done: checks?.linkedinPresent ?? !!status.steps.linkedin },
    { id: "opportunities", done: checks?.opportunitiesApproved ?? !!status.steps.opportunities_10 },
    { id: "application", done: checks?.applicationApproved ?? !!status.steps.application_submitted },
    {
      id: "attendance",
      done: checks?.attendancePassed ?? (status.attendancePercent != null && status.attendancePercent >= 70),
    },
  ];

  return {
    eligible: status.certificateEligible,
    requirements,
  };
}

/** Build mobile `labJourneySchema` payload from onboarding status + lab profile. */
export function buildLabJourney(status: OnboardingStatus, profile: LabProfile): LabJourney {
  const steps = UI_STEP_ORDER.map((uiId) => {
    const backendId = UI_TO_BACKEND[uiId]!;
    const state = status.stepStates[backendId];
    return {
      id: uiId,
      state,
      done: isDone(state) || !!status.steps[backendId],
    };
  });

  const next = steps.find((s) => !s.done);

  return {
    steps,
    progressPercent: status.progressPercent,
    nextStepId: next?.id ?? null,
    certificate: mapCertificate(status),
    profile: mapProfile(profile),
    savedGrantsCount: status.selectedOpportunityCount,
    opportunitiesTarget: OPPORTUNITIES_TARGET,
  };
}

/** Map mobile PATCH body field names onto onboarding lab-profile update fields. */
export function mapLabProfileUpdateBody(body: Record<string, unknown>): {
  fullName?: string;
  telegramUsername?: string;
  cityOrDistrict?: string;
  educationStatus?: string;
  interests?: string[];
  cvStatus?: string;
  linkedinUrl?: string;
  selectedOpportunityCount?: number;
} {
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((value): value is string => typeof value === "string")
    : undefined;

  return {
    fullName: typeof body.fullName === "string" ? body.fullName.trim() : undefined,
    telegramUsername:
      typeof body.telegram === "string"
        ? body.telegram.trim()
        : typeof body.telegramUsername === "string"
          ? body.telegramUsername.trim()
          : undefined,
    cityOrDistrict:
      typeof body.city === "string"
        ? body.city.trim()
        : typeof body.cityOrDistrict === "string"
          ? body.cityOrDistrict.trim()
          : undefined,
    educationStatus: typeof body.educationStatus === "string" ? body.educationStatus.trim() : undefined,
    interests,
    cvStatus: typeof body.cvStatus === "string" ? body.cvStatus : undefined,
    linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : undefined,
    selectedOpportunityCount:
      body.selectedOpportunityCount === undefined
        ? undefined
        : Number(body.selectedOpportunityCount),
  };
}
