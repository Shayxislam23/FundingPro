export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listOrganizations } from "@/lib/db/organizations";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const organizations = await listOrganizations(limit);
  return apiSuccess({ organizations, total: organizations.length });
});
