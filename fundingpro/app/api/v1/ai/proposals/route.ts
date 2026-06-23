export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { listProposalProjects } from "@/lib/db/proposals";

export const GET = withActiveUser(async (req, authUser) => {
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") ?? "10"), 50);
  const proposals = await listProposalProjects(authUser.userId, limit);
  return apiSuccess({ proposals });
});
