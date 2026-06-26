import { api, convexQuery } from "@/lib/convex-server";

export async function getActivationFunnel(
  accessToken: string,
  opts?: { last30DaysSignups?: boolean }
) {
  return convexQuery(
    api.adminStats.funnel,
    {
      ...opts,
      now: opts?.last30DaysSignups ? Date.now() : undefined,
    },
    accessToken
  );
}
