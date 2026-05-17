import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/support-tickets
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const skip = (page - 1) * limit;

  const where = {
    userId: authUser.userId,
    ...(status && { status: status as never }),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, subject: true, status: true, priority: true, createdAt: true, resolvedAt: true },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return apiSuccess({ tickets, total, page, limit });
}

// POST /api/v1/support-tickets
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { subject, message, priority } = body;

    if (!subject?.trim() || !message?.trim()) {
      return apiError("subject and message required", 400, "MISSING_FIELDS");
    }
    if (subject.length > 200) {
      return apiError("Subject too long (max 200 chars)", 400, "SUBJECT_TOO_LONG");
    }
    if (message.length > 5000) {
      return apiError("Message too long (max 5000 chars)", 400, "MESSAGE_TOO_LONG");
    }

    const allowedPriorities = ["low", "normal", "high", "urgent"];
    const ticketPriority = allowedPriorities.includes(priority) ? priority : "normal";

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: authUser.userId,
        subject: subject.trim(),
        message: message.trim(),
        status: "OPEN",
        priority: ticketPriority,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "support_ticket_create",
        entityType: "SupportTicket",
        entityId: ticket.id,
        metadata: { subject: ticket.subject, priority: ticketPriority },
      },
    });

    return apiSuccess({ ticketId: ticket.id, status: ticket.status }, 201);
  } catch (err) {
    console.error("POST /support-tickets error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
