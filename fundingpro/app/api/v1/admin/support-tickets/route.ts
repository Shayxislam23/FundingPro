export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";

// GET /api/v1/admin/support-tickets
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

    if (isLocalDatabaseEnabled()) {
      const pool = getPgPool();
      const conditions: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (status) {
        conditions.push(`t.status = $${i}`);
        values.push(status);
        i++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM support_tickets t ${where}`, values);
      const total = countResult.rows[0]?.total ?? 0;

      const result = await pool.query(
        `SELECT t.id, t.subject, t.message, t.status, t.priority, t.created_at, t.resolved_at,
                u.email AS user_email
         FROM support_tickets t
         LEFT JOIN users u ON u.id = t.user_id
         ${where}
         ORDER BY t.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...values, limit, offset]
      );

      return apiSuccess({
        tickets: result.rows.map((r) => ({
          id: String(r.id),
          subject: String(r.subject),
          message: String(r.message),
          status: String(r.status),
          priority: String(r.priority),
          userEmail: r.user_email ? String(r.user_email) : null,
          createdAt: new Date(String(r.created_at)).toISOString(),
          resolvedAt: r.resolved_at ? new Date(String(r.resolved_at)).toISOString() : null,
        })),
        total,
        page,
        limit,
      });
    }

    const supabase = createSupabaseAdmin();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("support_tickets")
      .select("id, subject, message, status, priority, created_at, resolved_at, user_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    const { data: tickets, count, error } = await query;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((tickets ?? []).map((t) => t.user_id)));
    const emailMap: Record<string, string | null> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, email").in("id", userIds);
      for (const u of users ?? []) emailMap[u.id] = u.email;
    }

    return apiSuccess({
      tickets: (tickets ?? []).map((t) => ({
        id: t.id,
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        userEmail: emailMap[t.user_id] ?? null,
        createdAt: t.created_at,
        resolvedAt: t.resolved_at,
      })),
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /admin/support-tickets error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
