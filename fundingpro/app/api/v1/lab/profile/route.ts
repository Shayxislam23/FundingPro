export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getOnboardingStatus, updateLabProfile } from "@/lib/db/onboarding";
import { setUserMode } from "@/lib/db/user-mode";
import { buildLabJourney, mapLabProfileUpdateBody } from "@/lib/lab-journey";

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

const ALLOWED_CV = new Set([
  "not_started",
  "in_progress",
  "submitted",
  "needs_revision",
  "completed",
  "help_requested",
  "uploaded",
]);

/** Mobile + spec: PATCH /api/v1/lab/profile — returns full labJourneySchema payload. */
export const PATCH = withActiveUser(async (req, authUser) => {
  const body = (await req.json()) as Record<string, unknown>;
  const mapped = mapLabProfileUpdateBody(body);

  const interests = mapped.interests
    ? mapped.interests.filter((value) => ALLOWED_INTERESTS.has(value))
    : undefined;

  if (mapped.selectedOpportunityCount !== undefined && !Number.isFinite(mapped.selectedOpportunityCount)) {
    return apiError("selectedOpportunityCount must be a number", 400, "INVALID_INPUT");
  }

  let cvStatus = mapped.cvStatus;
  if (cvStatus === "uploaded") cvStatus = "completed";
  if (cvStatus !== undefined && !ALLOWED_CV.has(cvStatus)) {
    return apiError("Invalid cvStatus", 400, "INVALID_INPUT");
  }

  const profile = await updateLabProfile(
    {
      fullName: mapped.fullName,
      telegramUsername: mapped.telegramUsername,
      cityOrDistrict: mapped.cityOrDistrict,
      educationStatus: mapped.educationStatus,
      interests,
      cvStatus: cvStatus as
        | "not_started"
        | "in_progress"
        | "submitted"
        | "needs_revision"
        | "completed"
        | "help_requested"
        | undefined,
      linkedinUrl: mapped.linkedinUrl,
      selectedOpportunityCount: mapped.selectedOpportunityCount,
    },
    authUser.accessToken
  );

  await setUserMode("individual", authUser.accessToken);

  const status = await getOnboardingStatus(authUser.accessToken);
  return apiSuccess(buildLabJourney(status, profile));
});
