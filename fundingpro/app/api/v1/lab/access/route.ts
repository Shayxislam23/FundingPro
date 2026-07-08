export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getLabAccess } from "@/lib/db/lab";

export const GET = withActiveUser(async (_req, authUser) => {
  const access = await getLabAccess(authUser.accessToken);
  return apiSuccess(access);
});
