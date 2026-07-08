export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getLabProfile, updateLabProfile } from "@/lib/db/onboarding";
import { setUserMode } from "@/lib/db/user-mode";

const ALLOWED_INTERESTS = new Set([
  "grants",
  "scholarships",
  "forums",
  "competitions",
  "internships",
  "volunteering",
  "exchange_programs",
  "hackathons",
  "startup_programs",
]);

export const GET = withActiveUser(async (_req, authUser) => {
  const profile = await getLabProfile(authUser.accessToken);
  return apiSuccess({ profile });
});

export const PATCH = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((value: unknown) => typeof value === "string" && ALLOWED_INTERESTS.has(value))
    : undefined;

  const selectedOpportunityCount =
    body.selectedOpportunityCount === undefined
      ? undefined
      : Number(body.selectedOpportunityCount);

  if (selectedOpportunityCount !== undefined && !Number.isFinite(selectedOpportunityCount)) {
    return apiError("selectedOpportunityCount must be a number", 400, "INVALID_INPUT");
  }

  const profile = await updateLabProfile(
    {
      fullName: typeof body.fullName === "string" ? body.fullName.trim() : undefined,
      telegramUsername: typeof body.telegramUsername === "string" ? body.telegramUsername.trim() : undefined,
      cityOrDistrict: typeof body.cityOrDistrict === "string" ? body.cityOrDistrict.trim() : undefined,
      educationStatus: typeof body.educationStatus === "string" ? body.educationStatus.trim() : undefined,
      interests,
      cvStatus: typeof body.cvStatus === "string" ? body.cvStatus : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : undefined,
      selectedOpportunityCount,
    },
    authUser.accessToken
  );

  await setUserMode("individual", authUser.accessToken);

  return apiSuccess({ profile });
});
