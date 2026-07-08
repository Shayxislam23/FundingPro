export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { reviewLabTask, type LabTaskType, type MentorReviewStatus } from "@/lib/db/onboarding";

const REVIEWABLE_TASKS = new Set<LabTaskType>([
  "cv",
  "motivation_letter",
  "chosen_opportunity",
  "application_submitted",
  "proof_uploaded",
]);

const REVIEW_STATUSES = new Set<MentorReviewStatus>([
  "pending_review",
  "needs_revision",
  "approved",
  "rejected",
]);

export const PATCH = withAdmin(async (req, admin) => {
  const body = await req.json();
  const userId = String(body.userId ?? "");
  const taskType = String(body.taskType ?? "") as LabTaskType;
  const mentorStatus = String(body.mentorStatus ?? "") as MentorReviewStatus;

  if (!userId) return apiError("userId required", 400, "MISSING_FIELDS");
  if (!REVIEWABLE_TASKS.has(taskType)) return apiError("Invalid taskType", 400, "INVALID_TASK");
  if (!REVIEW_STATUSES.has(mentorStatus)) return apiError("Invalid mentorStatus", 400, "INVALID_STATUS");

  const task = await reviewLabTask(
    {
      userId,
      taskType,
      mentorStatus,
      revisionNote: typeof body.revisionNote === "string" ? body.revisionNote.trim() : undefined,
    },
    admin.accessToken
  );

  return apiSuccess({ task });
});
