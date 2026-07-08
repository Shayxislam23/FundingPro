export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { trackServerEvent } from "@/lib/analytics-server";
import { submitLabTask, type LabTaskType } from "@/lib/db/onboarding";

const SUBMITTABLE_TASKS = new Set<LabTaskType>([
  "cv",
  "motivation_letter",
  "chosen_opportunity",
  "application_submitted",
  "proof_uploaded",
]);

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const taskType = String(body.taskType ?? "") as LabTaskType;

  if (!SUBMITTABLE_TASKS.has(taskType)) {
    return apiError("Invalid taskType", 400, "INVALID_TASK");
  }

  const evidenceDocumentId =
    typeof body.evidenceDocumentId === "string" && body.evidenceDocumentId
      ? body.evidenceDocumentId
      : undefined;

  const task = await submitLabTask({ taskType, evidenceDocumentId }, authUser.accessToken);
  trackServerEvent("lab_task_submitted", { taskType, userId: authUser.userId });
  if (taskType === "application_submitted") {
    trackServerEvent("north_star_application_submitted", { userId: authUser.userId });
  }
  return apiSuccess({ task });
});
