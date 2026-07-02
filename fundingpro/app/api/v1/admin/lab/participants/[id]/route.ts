export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin, getRouteParam } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { updateLabParticipant, type LabParticipantAdminUpdate } from "@/lib/db/lab";

const PARTICIPANT_STATUSES = new Set([
  "New applicant",
  "Registered",
  "Onboarding incomplete",
  "Active participant",
  "Needs reminder",
  "Strong participant",
  "Application submitted",
  "Completed",
  "Dropped",
]);

const REVIEW_STATES = new Set(["submitted", "needs_revision", "approved"]);

/** PATCH /api/v1/admin/lab/participants/:id — mentor status/notes/attendance/reviews. */
export const PATCH = withAdmin(async (req, admin, ctx) => {
  const id = await getRouteParam(ctx, "id");
  if (!id) return apiError("Missing id", 400, "MISSING_ID");

  const body = await req.json();
  const update: LabParticipantAdminUpdate = {};

  if (typeof body.mentorStatus === "string") {
    if (!PARTICIPANT_STATUSES.has(body.mentorStatus)) {
      return apiError("invalid mentorStatus", 400, "INVALID_FIELD");
    }
    update.mentorStatus = body.mentorStatus;
  }
  if (typeof body.mentorNotes === "string") update.mentorNotes = body.mentorNotes.slice(0, 2000);
  if (typeof body.attendanceOk === "boolean") update.attendanceOk = body.attendanceOk;
  if (typeof body.motivationLetterStatus === "string" && REVIEW_STATES.has(body.motivationLetterStatus)) {
    update.motivationLetterStatus = body.motivationLetterStatus as LabParticipantAdminUpdate["motivationLetterStatus"];
  }
  if (typeof body.applicationProofStatus === "string" && REVIEW_STATES.has(body.applicationProofStatus)) {
    update.applicationProofStatus = body.applicationProofStatus as LabParticipantAdminUpdate["applicationProofStatus"];
  }

  if (Object.keys(update).length === 0) {
    return apiError("no valid fields to update", 400, "MISSING_FIELDS");
  }

  await updateLabParticipant(id, update, admin.accessToken);

  await writeAuditLog({
    userId: admin.userId,
    action: "admin_lab_participant_update",
    entityType: "lab_participant",
    entityId: id,
    metadata: Object.fromEntries(Object.entries(update).map(([k, v]) => [k, String(v)])),
  });

  return apiSuccess({ updated: true });
});
