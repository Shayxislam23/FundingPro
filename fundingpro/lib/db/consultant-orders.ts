import { api, convexMutation, convexPublicQuery, convexQuery } from "@/lib/convex-server";
import { ensureInternalUser, type InternalUser } from "@/lib/db/users";

export async function listConsultants(opts?: {
  specialty?: string;
  country?: string;
  page?: number;
  limit?: number;
}) {
  return convexPublicQuery(api.consultants.list, {
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 20,
    specialty: opts?.specialty,
    country: opts?.country,
  });
}

export async function createConsultantOrder(
  input: {
    consultantId: string;
    packageName: string;
    amountUsd: number;
    notes?: string;
  },
  accessToken: string
) {
  return convexMutation(api.consultants.createOrder, input, accessToken);
}

export async function listUserConsultantOrders(accessToken: string) {
  return convexQuery(api.consultants.listUserOrders, {}, accessToken);
}

export async function ensureUserForOrder(
  email: string | null,
  accessToken: string
): Promise<InternalUser> {
  return ensureInternalUser({ email, emailVerified: true, provider: "clerk" }, accessToken);
}

export async function listAdminConsultantOrders(limit: number, accessToken: string) {
  return convexQuery(api.consultants.listAdminOrders, { limit }, accessToken);
}

export async function updateConsultantOrderStatus(
  orderId: string,
  status: string,
  accessToken: string
) {
  return convexMutation(api.consultants.updateOrderStatus, { orderId, status }, accessToken);
}
