import { api, convexMutation, convexQuery } from "@/lib/convex-server";

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
