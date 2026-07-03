export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureInternalUser } from "@/lib/db/users";
import { getLabJourney, updateLabProfile, type LabProfileUpdate } from "@/lib/db/lab";

const INTERESTS = new Set([
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

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, maxLength);
}

/** PATCH /api/v1/lab/profile — upsert the participant's Lab profile fields. */
export const PATCH = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  await ensureInternalUser({ email: authUser.email, provider: "clerk" }, authUser.accessToken);

  const update: LabProfileUpdate = {};
  const fullName = optionalString(body.fullName, 200);
  if (fullName !== undefined) update.fullName = fullName;
  const city = optionalString(body.city, 200);
  if (city !== undefined) update.city = city;
  const telegram = optionalString(body.telegram, 100);
  if (telegram !== undefined) update.telegram = telegram;
  const educationStatus = optionalString(body.educationStatus, 200);
  if (educationStatus !== undefined) update.educationStatus = educationStatus;
  const linkedinUrl = optionalString(body.linkedinUrl, 300);
  if (linkedinUrl !== undefined) update.linkedinUrl = linkedinUrl;
  const chosenGrantId = optionalString(body.chosenGrantId, 100);
  if (chosenGrantId) update.chosenGrantId = chosenGrantId;

  if (body.age !== undefined) {
    const age = Number(body.age);
    if (!Number.isFinite(age) || age < 10 || age > 100) {
      return apiError("age must be between 10 and 100", 400, "INVALID_FIELD");
    }
    update.age = Math.round(age);
  }

  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests)) {
      return apiError("interests must be an array", 400, "INVALID_FIELD");
    }
    update.interests = body.interests
      .filter((i: unknown): i is string => typeof i === "string" && INTERESTS.has(i))
      .slice(0, 12);
  }

  if (body.cvStatus !== undefined) {
    if (body.cvStatus !== "uploaded" && body.cvStatus !== "help_requested") {
      return apiError("cvStatus must be uploaded or help_requested", 400, "INVALID_FIELD");
    }
    update.cvStatus = body.cvStatus;
  }

  if (body.motivationLetterStatus === "submitted") update.motivationLetterStatus = "submitted";
  if (body.applicationProofStatus === "submitted") update.applicationProofStatus = "submitted";

  if (Object.keys(update).length === 0) {
    return apiError("no valid fields to update", 400, "MISSING_FIELDS");
  }

  await updateLabProfile(update, authUser.accessToken);
  const journey = await getLabJourney(authUser.accessToken);
  return apiSuccess(journey);
});
