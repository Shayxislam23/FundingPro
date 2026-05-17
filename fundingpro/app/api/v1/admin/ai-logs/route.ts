import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/admin/ai-logs?page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const from = (page - 1) * limit;

  const supabase = createSupabaseAdmin();

  // Try ai_requests table first, fall back to audit_logs filtered by AI actions
  const { data: aiLogs, count, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
    .in("action", ["ai_proposal_generate", "ai_eligibility_check", "ai_match_grants", "ai_budget_narrative"])
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error && error.code === "42P01") {
    return apiSuccess({ logs: [], total: 0, page, limit });
  }
  if (error) return apiError("Internal error", 500, "INTERNAL_ERROR");

  const logs = (aiLogs ?? []).map((log) => ({
    id: log.id,
    user_id: log.user_id,
    action: log.action,
    model: (log.metadata as Record<string, unknown>)?.model ?? "mock",
    tokens: (log.metadata as Record<string, unknown>)?.tokens ?? 0,
    pii_redacted: (log.metadata as Record<string, unknown>)?.pii_redacted ?? false,
    created_at: log.created_at,
  }));

  return apiSuccess({ logs, total: count ?? 0, page, limit });
}
