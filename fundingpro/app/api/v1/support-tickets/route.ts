import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/support-tickets
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  // TODO: fetch user's support tickets
  return apiSuccess({ tickets: [], total: 0 });
}

// POST /api/v1/support-tickets
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message?.trim()) {
      return apiError("subject and message required", 400, "MISSING_FIELDS");
    }

    // Input length validation
    if (message.length > 5000) {
      return apiError("Message too long (max 5000 chars)", 400, "MESSAGE_TOO_LONG");
    }

    // TODO: create SupportTicket in database
    // TODO: notify support team

    return apiSuccess({ ticketId: "TODO_ID", status: "open" }, 201);
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
