export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getOnboardingStatus } from "@/lib/db/onboarding";

export const GET = withActiveUser(async (_req, authUser) => {
  const status = await getOnboardingStatus(authUser.accessToken);
  return apiSuccess(status);
});
