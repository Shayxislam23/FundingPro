export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { checkAiRateLimitAsync } from "@/lib/ai-rate-limit";
import { listProposalProjects } from "@/lib/db/proposals";

export const GET = withActiveUser(async (req, authUser) => {
  if (!(await checkAiRateLimitAsync(authUser.userId))) {
    return apiError("Too many AI requests. Try again later.", 429, "RATE_LIMITED");
  }

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get("limit") ?? "10"), 50);
  const proposals = await listProposalProjects(authUser.userId, limit);
  return apiSuccess({ proposals });
});
