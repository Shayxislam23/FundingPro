export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { canAccessAdmin } from "@/lib/auth/admin-access";

/** GET /api/v1/auth/admin-check — active users only; used for unified admin gate. */
export const GET = withActiveUser(async (_req, user) => {
  const isAdmin = await canAccessAdmin(user.accessToken, user.email);
  return apiSuccess({ isAdmin });
});
