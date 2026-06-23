import { withDatabase } from "@/lib/db/runtime";

export async function listAdminUsers(opts: { page: number; limit: number; search?: string }) {
  const offset = (opts.page - 1) * opts.limit;

  return withDatabase(
    async (pool) => {
      const conditions: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (opts.search?.trim()) {
        conditions.push(`email ILIKE $${i}`);
        values.push(`%${opts.search.trim()}%`);
        i++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, values);
      const total = countResult.rows[0]?.total ?? 0;

      const result = await pool.query(
        `SELECT id, email, email_verified, is_active, created_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...values, opts.limit, offset]
      );

      const users = result.rows.map((u) => ({
        id: String(u.id),
        email: u.email ? String(u.email) : null,
        created_at: new Date(String(u.created_at)).toISOString(),
        last_sign_in_at: null as string | null,
        email_confirmed: Boolean(u.email_verified),
        user_metadata: {} as Record<string, unknown>,
      }));

      return { users, total, page: opts.page, perPage: opts.limit };
    },
    async (supabase) => {
      const { data, error } = await supabase.auth.admin.listUsers({ page: opts.page, perPage: opts.limit });
      if (error) throw new Error(error.message);

      const users = (data?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: !!u.email_confirmed_at,
        user_metadata: u.user_metadata ?? {},
      }));

      const total = "total" in (data ?? {}) ? (data as { total: number }).total : users.length;
      return { users, total, page: opts.page, perPage: opts.limit };
    }
  );
}

export async function setUserActive(userId: string, isActive: boolean): Promise<boolean> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1::uuid RETURNING id`,
        [userId, isActive]
      );
      return (result.rowCount ?? 0) > 0;
    },
    async (supabase) => {
      if (!isActive) {
        const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        if (error) throw new Error(error.message);
        return true;
      }
      const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (error) throw new Error(error.message);
      return true;
    }
  );
}

export async function listAiRequests(opts: { page: number; limit: number }) {
  const offset = (opts.page - 1) * opts.limit;

  return withDatabase(
    async (pool) => {
      const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM ai_requests`);
      const total = countResult.rows[0]?.total ?? 0;

      const result = await pool.query(
        `SELECT ar.id, ar.user_id, ar.request_type, ar.model, ar.input_tokens, ar.output_tokens,
                ar.redaction_applied, ar.status, ar.created_at, u.email AS user_email
         FROM ai_requests ar
         LEFT JOIN users u ON u.id = ar.user_id
         ORDER BY ar.created_at DESC
         LIMIT $1 OFFSET $2`,
        [opts.limit, offset]
      );

      const logs = result.rows.map((r) => ({
        id: String(r.id),
        user_id: String(r.user_id),
        user_email: r.user_email ? String(r.user_email) : null,
        action: String(r.request_type),
        model: String(r.model),
        tokens: Number(r.output_tokens ?? 0),
        pii_redacted: Boolean(r.redaction_applied),
        status: String(r.status),
        created_at: new Date(String(r.created_at)).toISOString(),
      }));

      return { logs, total, page: opts.page, limit: opts.limit };
    },
    async (supabase) => {
      const from = offset;
      const to = from + opts.limit - 1;

      const { data, count, error } = await supabase
        .from("ai_requests")
        .select("id, user_id, request_type, model, output_tokens, redaction_applied, status, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        if (error.code === "42P01") return { logs: [], total: 0, page: opts.page, limit: opts.limit };
        throw new Error(error.message);
      }

      const logs = (data ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        user_email: null,
        action: r.request_type,
        model: r.model,
        tokens: r.output_tokens ?? 0,
        pii_redacted: r.redaction_applied,
        status: r.status,
        created_at: r.created_at,
      }));

      return { logs, total: count ?? 0, page: opts.page, limit: opts.limit };
    }
  );
}

export async function listAuditLogs(opts: { page: number; limit: number }) {
  const offset = (opts.page - 1) * opts.limit;

  return withDatabase(
    async (pool) => {
      const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs`);
      const total = countResult.rows[0]?.total ?? 0;

      const result = await pool.query(
        `SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id, al.metadata, al.created_at,
                u.email AS user_email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC
         LIMIT $1 OFFSET $2`,
        [opts.limit, offset]
      );

      return {
        logs: result.rows.map((r) => ({
          id: String(r.id),
          userId: r.user_id ? String(r.user_id) : null,
          userEmail: r.user_email ? String(r.user_email) : null,
          action: String(r.action),
          entityType: r.entity_type ? String(r.entity_type) : null,
          entityId: r.entity_id ? String(r.entity_id) : null,
          metadata: r.metadata,
          createdAt: new Date(String(r.created_at)).toISOString(),
        })),
        total,
        page: opts.page,
        limit: opts.limit,
      };
    },
    async (supabase) => {
      const from = offset;
      const to = from + opts.limit - 1;

      const { data, count, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        if (error.code === "42P01") return { logs: [], total: 0, page: opts.page, limit: opts.limit };
        throw new Error(error.message);
      }

      return {
        logs: (data ?? []).map((r) => ({
          id: r.id,
          userId: r.user_id,
          userEmail: null,
          action: r.action,
          entityType: r.entity_type,
          entityId: r.entity_id,
          metadata: r.metadata,
          createdAt: r.created_at,
        })),
        total: count ?? 0,
        page: opts.page,
        limit: opts.limit,
      };
    }
  );
}
