export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { getUserMode, setUserMode } from "@/lib/db/user-mode";

export const GET = withActiveUser(async (_req, authUser) => {
  const userMode = await getUserMode(authUser.accessToken);
  return apiSuccess({ userMode });
});

export const PATCH = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const userMode = body.userMode;

  if (userMode !== "individual") {
    return apiError("userMode must be individual", 400, "INVALID_INPUT");
  }

  const updated = await setUserMode(userMode, authUser.accessToken);
  return apiSuccess({ userMode: updated });
});
