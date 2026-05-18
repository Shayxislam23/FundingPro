export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/support-tickets
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const from = (page - 1) * limit;

  const supabase = createSupabaseAdmin();
  const { data: tickets, count } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, created_at, resolved_at", { count: "exact" })
    .eq("user_id", authUser.userId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return apiSuccess({ tickets: tickets ?? [], total: count ?? 0, page, limit });
}

// POST /api/v1/support-tickets
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { subject, message, priority } = body;

    if (!subject?.trim() || !message?.trim()) return apiError("subject and message required", 400, "MISSING_FIELDS");
    if (subject.length > 200) return apiError("Subject too long (max 200)", 400, "SUBJECT_TOO_LONG");
    if (message.length > 5000) return apiError("Message too long (max 5000)", 400, "MESSAGE_TOO_LONG");

    const allowed = ["low", "normal", "high", "urgent"];
    const ticketPriority = allowed.includes(priority) ? priority : "normal";

    const supabase = createSupabaseAdmin();
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: authUser.userId, subject: subject.trim(), message: message.trim(), status: "open", priority: ticketPriority })
      .select("id, status")
      .single();

    if (error) throw new Error(error.message);
    return apiSuccess({ ticketId: ticket.id, status: ticket.status }, 201);
  } catch (err) {
    console.error("POST /support-tickets error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
