import { api, convexMutation, convexQuery } from "@/lib/convex-server";

const STATUS_TO_API: Record<string, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const STATUS_TO_CONVEX: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN_PROGRESS",
  resolved: "RESOLVED",
  closed: "CLOSED",
};

export type AdminSupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  userEmail: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

function toApiStatus(status: string): string {
  return STATUS_TO_API[status] ?? status.toLowerCase();
}

function toConvexStatus(status: string): string {
  return STATUS_TO_CONVEX[status] ?? status.toUpperCase();
}

export async function listAdminSupportTickets(
  opts: {
    status?: string;
    page: number;
    limit: number;
  },
  accessToken: string
): Promise<{ tickets: AdminSupportTicket[]; total: number; page: number; limit: number }> {
  const fetchLimit = Math.min(Math.max(opts.page * opts.limit, opts.limit), 500);
  const rows = await convexQuery(api.support.listForAdmin, { limit: fetchLimit }, accessToken);

  let tickets: AdminSupportTicket[] = rows.map((t) => ({
    id: t.id,
    subject: t.subject,
    message: t.message,
    status: toApiStatus(t.status),
    priority: t.priority,
    userEmail: t.userEmail,
    createdAt: t.createdAt,
    resolvedAt: t.resolvedAt,
  }));

  if (opts.status) {
    tickets = tickets.filter((t) => t.status === opts.status);
  }

  const total = tickets.length;
  const offset = (opts.page - 1) * opts.limit;
  const page = tickets.slice(offset, offset + opts.limit);

  return { tickets: page, total, page: opts.page, limit: opts.limit };
}

export async function updateAdminSupportTicketStatus(
  ticketId: string,
  status: string,
  accessToken: string
): Promise<void> {
  await convexMutation(
    api.support.updateStatus,
    {
      ticketId,
      status: toConvexStatus(status),
    },
    accessToken
  );
}
