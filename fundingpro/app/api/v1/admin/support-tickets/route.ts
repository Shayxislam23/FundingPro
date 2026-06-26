export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listAdminSupportTickets } from "@/lib/db/admin-support";

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

  const result = await listAdminSupportTickets(
    {
      status: status || undefined,
      page,
      limit,
    },
    admin.accessToken
  );

  return apiSuccess(result);
});
