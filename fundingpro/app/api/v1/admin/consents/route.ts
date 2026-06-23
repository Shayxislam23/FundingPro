export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listRecentConsents } from "@/lib/db/admin-consents";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const consents = await listRecentConsents(limit);
  return apiSuccess({ consents, total: consents.length });
});
