import { withDatabase } from "@/lib/db/runtime";

export async function getAdminDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  return withDatabase(
    async (pool) => {
      const [counts, recentUsers, settings] = await Promise.all([
        pool.query(`
          SELECT
            (SELECT COUNT(*)::int FROM users) AS users,
            (SELECT COUNT(*)::int FROM organizations WHERE deleted_at IS NULL) AS organizations,
            (SELECT COUNT(*)::int FROM grants) AS grants,
            (SELECT COUNT(*)::int FROM applications) AS applications,
            (SELECT COUNT(*)::int FROM support_tickets) AS support_tickets,
            (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open') AS open_tickets,
            (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'ACTIVE') AS active_subscriptions,
            (SELECT COUNT(*)::int FROM ai_requests WHERE created_at >= $1::timestamptz) AS ai_requests_month,
            (SELECT COUNT(*)::int FROM support_tickets WHERE subject ILIKE 'Запрос тарифа:%') AS subscription_requests
        `, [startOfMonth]),
        pool.query(`SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5`),
        pool.query(`SELECT key, value FROM settings WHERE key IN ('paymentsIntegrationStatus', 'aiProviderStatus')`),
      ]);

      const c = counts.rows[0] ?? {};
      const settingsMap = Object.fromEntries(settings.rows.map((r) => [String(r.key), r.value]));

      return {
        totalUsers: Number(c.users ?? 0),
        totalOrganizations: Number(c.organizations ?? 0),
        totalGrants: Number(c.grants ?? 0),
        totalApplications: Number(c.applications ?? 0),
        totalSupportTickets: Number(c.support_tickets ?? 0),
        activeSubscriptions: Number(c.active_subscriptions ?? 0),
        aiRequestsThisMonth: Number(c.ai_requests_month ?? 0),
        openTickets: Number(c.open_tickets ?? 0),
        subscriptionRequests: Number(c.subscription_requests ?? 0),
        recentUsers: recentUsers.rows.map((u) => ({
          id: String(u.id),
          email: u.email ? String(u.email) : null,
          createdAt: new Date(String(u.created_at)).toISOString(),
        })),
        integrationStatus: {
          payments: String(settingsMap.paymentsIntegrationStatus ?? "pending_integration"),
          paymentsEnabled: process.env.PAYMENTS_ENABLED === "true",
          aiProvider: String(settingsMap.aiProviderStatus ?? process.env.AI_PROVIDER ?? "mock"),
        },
      };
    },
    async (supabase) => {
      const [
        { count: totalGrants },
        { count: totalApplications },
        { count: totalSupportTickets },
        { count: openTickets },
        { count: activeSubscriptions },
        { count: aiRequestsThisMonth },
        { count: internalUsers },
        { count: totalOrganizations },
        { data: recentUsers },
        { data: settings },
        { count: subscriptionRequests },
      ] = await Promise.all([
        supabase.from("grants").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
        supabase.from("ai_requests").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("organizations").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("users").select("id, email, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("settings").select("key, value").in("key", ["paymentsIntegrationStatus", "aiProviderStatus"]),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).ilike("subject", "Запрос тарифа:%"),
      ]);

      const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

      return {
        totalUsers: internalUsers ?? 0,
        totalOrganizations: totalOrganizations ?? 0,
        totalGrants: totalGrants ?? 0,
        totalApplications: totalApplications ?? 0,
        totalSupportTickets: totalSupportTickets ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        aiRequestsThisMonth: aiRequestsThisMonth ?? 0,
        openTickets: openTickets ?? 0,
        subscriptionRequests: subscriptionRequests ?? 0,
        recentUsers: (recentUsers ?? []).map((u) => ({
          id: u.id,
          email: u.email ?? null,
          createdAt: u.created_at,
        })),
        integrationStatus: {
          payments: settingsMap.paymentsIntegrationStatus ?? "pending_integration",
          paymentsEnabled: process.env.PAYMENTS_ENABLED === "true",
          aiProvider: settingsMap.aiProviderStatus ?? process.env.AI_PROVIDER ?? "mock",
        },
      };
    }
  );
}
