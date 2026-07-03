import { labJourneySchema } from "@fundingpro/api-types";
import { apiFetch, parseResponse } from "./core";

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

export const labApi = {
  async labJourney() {
    return parseResponse(await apiFetch("/lab/journey"), labJourneySchema);
  },

  async updateLabProfile(update: LabProfileUpdate) {
    return parseResponse(
      await apiFetch("/lab/profile", { method: "PATCH", body: JSON.stringify(update) }),
      labJourneySchema
    );
  },
};
