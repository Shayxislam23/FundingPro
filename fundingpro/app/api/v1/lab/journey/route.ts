export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getLabProfile, getOnboardingStatus } from "@/lib/db/onboarding";
import { buildLabJourney } from "@/lib/lab-journey";

/** Mobile + spec: GET /api/v1/lab/journey */
export const GET = withActiveUser(async (_req, authUser) => {
  const [status, profile] = await Promise.all([
    getOnboardingStatus(authUser.accessToken),
    getLabProfile(authUser.accessToken),
  ]);
  return apiSuccess(buildLabJourney(status, profile));
});
