export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listLabParticipants } from "@/lib/db/lab";

/** GET /api/v1/admin/lab/participants — mentor journey table. */
export const GET = withAdmin(async (_req, admin) => {
  const participants = await listLabParticipants(admin.accessToken);
  return apiSuccess({ participants, total: participants.length });
});
