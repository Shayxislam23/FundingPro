export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { getAdminPaymentsReport } from "@/lib/db/admin-payments";

export const GET = withAdmin(async (_req, admin) => {
  const report = await getAdminPaymentsReport(admin.accessToken);
  return apiSuccess(report);
});
