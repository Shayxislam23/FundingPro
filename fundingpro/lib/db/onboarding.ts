import { api, convexQuery } from "@/lib/convex-server";

export type OnboardingStepId =
  | "profile"
  | "documents"
  | "saved_grant"
  | "eligibility"
  | "ai_proposal";

export type OnboardingStatus = {
  steps: Record<OnboardingStepId, boolean>;
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
};

export async function getOnboardingStatus(accessToken: string): Promise<OnboardingStatus> {
  return convexQuery(api.onboarding.getStatus, {}, accessToken);
}
