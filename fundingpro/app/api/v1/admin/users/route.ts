export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/admin/users?page=1&limit=20&search=
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

  if (error) return apiError("Failed to list users", 500, "INTERNAL_ERROR");

  const users = (data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    email_confirmed: !!u.email_confirmed_at,
    user_metadata: u.user_metadata ?? {},
  }));

  const total = "total" in (data ?? {}) ? (data as { total: number }).total : users.length;

  return apiSuccess({ users, total, page, perPage });
}
