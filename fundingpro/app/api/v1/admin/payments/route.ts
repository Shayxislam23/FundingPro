export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { getAdminPaymentsReport } from "@/lib/db/admin-payments";

export const GET = withAdmin(async (req, admin) => {
  const url = new URL(req.url);
  const providerParam = url.searchParams.get("provider");
  const provider =
    providerParam === "uzum" || providerParam === "payme" || providerParam === "click"
      ? providerParam
      : "all";

  const report = await getAdminPaymentsReport(admin.accessToken, { provider });
  return apiSuccess(report);
});
