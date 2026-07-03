import { api, convexMutation, convexQuery } from "@/lib/convex-server";

/**
 * The applicant's own success-fee record for one application (or null if
 * none exists yet). Convex exposes this as an authedMutation rather than a
 * query — it is only ever called from a server-side API route, never a
 * reactive client subscription, so the mutation/query distinction has no
 * user-facing effect here.
 */
export async function getMySuccessFee(applicationId: string, accessToken: string) {
  return convexMutation(api.successFee.getMyRecord, { applicationId }, accessToken);
}

export async function listSuccessFees(accessToken: string, status?: string) {
  return convexQuery(api.successFee.adminList, { status }, accessToken);
}

export async function updateSuccessFeeStatus(
  recordId: string,
  status: "pending" | "invoiced" | "paid" | "waived",
  accessToken: string
) {
  return convexMutation(api.successFee.adminUpdateStatus, { recordId, status }, accessToken);
}
