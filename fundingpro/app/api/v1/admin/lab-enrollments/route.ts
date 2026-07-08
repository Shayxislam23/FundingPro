export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import {
  listLabEnrollmentsForAdmin,
  markLabEnrollmentStatus,
  type LabEnrollmentStatus,
} from "@/lib/db/lab";

const STATUSES = new Set<LabEnrollmentStatus>([
  "pending_payment",
  "manual_review",
  "paid",
  "failed",
  "refunded",
]);

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10) || 100, 200);
  const result = await listLabEnrollmentsForAdmin({ limit }, admin.accessToken);
  return apiSuccess(result);
});

export const PATCH = withAdmin(async (req, admin) => {
  const body = await req.json();
  const enrollmentId = String(body.enrollmentId ?? "");
  const status = String(body.status ?? "") as LabEnrollmentStatus;

  if (!enrollmentId) return apiError("enrollmentId required", 400, "MISSING_FIELDS");
  if (!STATUSES.has(status)) return apiError("Invalid status", 400, "INVALID_STATUS");

  const enrollment = await markLabEnrollmentStatus(
    {
      enrollmentId,
      status,
      notes: typeof body.notes === "string" ? body.notes.trim() : undefined,
    },
    admin.accessToken
  );
  return apiSuccess({ enrollment });
});
