export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/v1/admin/dashboard
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const supabase = createSupabaseAdmin();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalGrants },
    { count: totalApplications },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("grants").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 5 }),
  ]);

  // Get Supabase auth user count
  const allUsersResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const totalUsers = "total" in (allUsersResult.data ?? {}) ? (allUsersResult.data as { total: number }).total : 0;

  return apiSuccess({
    totalUsers,
    totalGrants: totalGrants ?? 0,
    totalApplications: totalApplications ?? 0,
    totalSupportTickets: 0,
    activeSubscriptions: 0,
    aiRequestsThisMonth: 0,
    openTickets: 0,
    recentUsers: (recentUsers?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
    })),
    integrationStatus: {
      payments: "pending_integration",
      paymentsEnabled: false,
      aiProvider: process.env.AI_PROVIDER ?? "mock",
    },
  });
}
