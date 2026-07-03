export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listSuccessFees } from "@/lib/db/success-fees";

/** GET /api/v1/admin/success-fees — ledger of 2-5% fees on won grants. */
export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const records = await listSuccessFees(admin.accessToken, status);
  return apiSuccess({ records, total: records.length });
});
