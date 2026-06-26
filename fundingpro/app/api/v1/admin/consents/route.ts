export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listRecentConsents } from "@/lib/db/admin-consents";

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const consents = await listRecentConsents(limit, admin.accessToken);
  return apiSuccess({ consents, total: consents.length });
});
