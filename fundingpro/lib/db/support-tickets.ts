import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export async function listUserSupportTickets(
  page: number,
  limit: number,
  accessToken: string
) {
  return convexQuery(api.support.listForUser, { page, limit }, accessToken);
}

export async function createSupportTicket(
  input: {
    subject: string;
    message: string;
    priority: string;
  },
  accessToken: string
) {
  return convexMutation(api.support.create, input, accessToken);
}
