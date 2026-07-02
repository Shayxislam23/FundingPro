export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureInternalUser } from "@/lib/db/users";
import { getLabJourney } from "@/lib/db/lab";

/** GET /api/v1/lab/journey — Opportunities Lab guided onboarding state. */
export const GET = withActiveUser(async (_req, authUser) => {
  await ensureInternalUser({ email: authUser.email, provider: "clerk" }, authUser.accessToken);
  const journey = await getLabJourney(authUser.accessToken);
  return apiSuccess(journey);
});
