import { api, convexQuery, convexMutation } from "@/lib/convex-server";

export async function getGrantForEligibility(opportunityId: string, accessToken: string) {
  return convexQuery(api.eligibility.getGrant, { opportunityId }, accessToken);
}

export async function saveEligibilityCheck(
  params: {
    opportunityId?: string | null;
    answers: Record<
      string,
      string | number | boolean | null | Array<string | number | boolean | null>
    >;
    score: number;
    status: string;
    strengths: string[];
    gaps: string[];
    nextSteps: string[];
    aiRequestId?: string | null;
  },
  accessToken: string
) {
  return convexMutation(api.eligibility.saveCheck, params, accessToken);
}
