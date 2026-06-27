import { api, convexQuery, convexMutation } from "@/lib/convex-server";

export async function getGrantForEligibility(grantId: string, accessToken: string) {
  return convexQuery(api.eligibility.getGrant, { grantId }, accessToken);
}

export async function saveEligibilityCheck(
  params: {
    grantId?: string | null;
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
