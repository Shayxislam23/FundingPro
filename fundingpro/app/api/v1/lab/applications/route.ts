export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import {
  listMyLabApplications,
  upsertMyLabApplication,
  type LabApplicationStatus,
  type LabSubmissionMethod,
} from "@/lib/db/lab";

const METHODS = new Set<LabSubmissionMethod>([
  "google_form",
  "email",
  "external_portal",
  "pdf_upload",
  "other",
]);

const STATUSES = new Set<LabApplicationStatus>([
  "planned",
  "preparing",
  "submitted",
  "proof_uploaded",
]);

export const GET = withActiveUser(async (_req, authUser) => {
  const applications = await listMyLabApplications(authUser.accessToken);
  return apiSuccess({ applications });
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const submissionMethod = String(body.submissionMethod ?? "other") as LabSubmissionMethod;
  const status = body.status ? String(body.status) as LabApplicationStatus : undefined;

  if (!title) return apiError("title required", 400, "MISSING_FIELDS");
  if (!METHODS.has(submissionMethod)) return apiError("Invalid submissionMethod", 400, "INVALID_METHOD");
  if (status && !STATUSES.has(status)) return apiError("Invalid status", 400, "INVALID_STATUS");

  const application = await upsertMyLabApplication(
    {
      applicationId: typeof body.applicationId === "string" ? body.applicationId : undefined,
      title,
      opportunityUrl: typeof body.opportunityUrl === "string" ? body.opportunityUrl.trim() : undefined,
      submissionMethod,
      status,
      proofDocumentId: typeof body.proofDocumentId === "string" ? body.proofDocumentId : undefined,
    },
    authUser.accessToken
  );

  return apiSuccess({ application });
});
