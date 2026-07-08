export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listLabParticipantJourney } from "@/lib/db/admin-users";

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
  const result = await listLabParticipantJourney({ limit }, admin.accessToken);
  return apiSuccess(result);
});
