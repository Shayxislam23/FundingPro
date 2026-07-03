import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export type LabStepState = "not_started" | "in_progress" | "submitted" | "needs_revision" | "completed";

export type LabStep = { id: string; state: LabStepState; done: boolean };

export type LabJourney = {
  steps: LabStep[];
  progressPercent: number;
  nextStepId: string | null;
  certificate: { eligible: boolean; requirements: { id: string; done: boolean }[] };
  profile: {
    fullName: string | null;
    age: number | null;
    city: string | null;
    telegram: string | null;
    educationStatus: string | null;
    interests: string[];
    cvStatus: string | null;
    linkedinUrl: string | null;
    motivationLetterStatus: string | null;
    chosenGrantId: string | null;
    applicationProofStatus: string | null;
  };
  savedGrantsCount: number;
  opportunitiesTarget: number;
};

export async function getLabJourney(accessToken: string): Promise<LabJourney> {
  return convexQuery(api.labJourney.getMyJourney, {}, accessToken);
}

export type LabProfileUpdate = {
  fullName?: string;
  age?: number;
  city?: string;
  telegram?: string;
  educationStatus?: string;
  interests?: string[];
  cvStatus?: "uploaded" | "help_requested";
  linkedinUrl?: string;
  motivationLetterStatus?: "submitted";
  chosenGrantId?: string;
  applicationProofStatus?: "submitted";
};

export async function updateLabProfile(update: LabProfileUpdate, accessToken: string) {
  return convexMutation(api.labJourney.updateMyProfile, update, accessToken);
}

export async function listLabParticipants(accessToken: string) {
  return convexQuery(api.labJourney.adminList, {}, accessToken);
}

export type LabParticipantAdminUpdate = {
  mentorStatus?: string;
  mentorNotes?: string;
  attendanceOk?: boolean;
  motivationLetterStatus?: "submitted" | "needs_revision" | "approved";
  applicationProofStatus?: "submitted" | "needs_revision" | "approved";
};

export async function updateLabParticipant(
  participantId: string,
  update: LabParticipantAdminUpdate,
  accessToken: string
) {
  return convexMutation(api.labJourney.adminUpdate, { participantId, ...update }, accessToken);
}
