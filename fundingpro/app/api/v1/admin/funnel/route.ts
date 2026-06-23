export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { getActivationFunnel } from "@/lib/db/admin-funnel";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const last30DaysSignups = searchParams.get("recent30d") === "true";

  const funnel = await getActivationFunnel({ last30DaysSignups });
  return apiSuccess({ funnel });
});
