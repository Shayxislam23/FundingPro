import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type ApplicationRow = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  grant: {
    id: string;
    title: string;
    title_ru: string | null;
    deadline: string | null;
    amount_min: number | null;
    amount_max: number | null;
    donor: { name: string | null; name_ru: string | null };
  } | null;
};

export async function listApplications(
  userId: string,
  opts: { status?: string; page: number; limit: number }
) {
  const offset = (opts.page - 1) * opts.limit;

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const conditions = ["a.user_id = $1::uuid"];
    const values: unknown[] = [userId];
    let i = 2;

    if (opts.status) {
      conditions.push(`a.status = $${i}`);
      values.push(opts.status);
      i++;
    }

    const where = conditions.join(" AND ");
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM applications a WHERE ${where}`,
      values
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT a.id, a.status, a.notes, a.created_at, a.updated_at,
              g.id AS grant_id, g.title, g.title_ru, g.deadline, g.amount_min, g.amount_max,
              d.name AS donor_name, d.name_ru AS donor_name_ru
       FROM applications a
       LEFT JOIN grants g ON g.id = a.grant_id
       LEFT JOIN donors d ON d.id = g.donor_id
       WHERE ${where}
       ORDER BY a.updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, opts.limit, offset]
    );

    const applications = result.rows.map(mapApplicationRow);
    return { applications, total, page: opts.page, limit: opts.limit, pages: Math.ceil(total / opts.limit) };
  }

  const supabase = createSupabaseAdmin();
  const from = offset;
  const to = from + opts.limit - 1;

  let query = supabase
    .from("applications")
    .select(
      `id, status, notes, created_at, updated_at,
       grant:grants ( id, title, title_ru, deadline, amount_min, amount_max, donor:donors ( name, name_ru ) )`,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (opts.status) query = query.eq("status", opts.status);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const applications = (data ?? []).map((row) => {
    const grantRaw = row.grant as unknown as ApplicationRow["grant"];
    return {
      id: row.id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      grant: grantRaw,
    } satisfies ApplicationRow;
  });

  return {
    applications,
    total,
    page: opts.page,
    limit: opts.limit,
    pages: Math.ceil(total / opts.limit),
  };
}

export async function createApplication(userId: string, grantId: string, notes?: string | null) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const grantCheck = await pool.query(`SELECT id FROM grants WHERE id = $1::uuid`, [grantId]);
    if (!grantCheck.rows[0]) return { error: "GRANT_NOT_FOUND" as const };

    const existing = await pool.query(
      `SELECT id, status FROM applications WHERE user_id = $1::uuid AND grant_id = $2::uuid`,
      [userId, grantId]
    );
    if (existing.rows[0]) {
      return {
        applicationId: String(existing.rows[0].id),
        status: String(existing.rows[0].status),
        alreadyExists: true,
      };
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO applications (id, user_id, grant_id, status, notes)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'saved', $4)`,
      [id, userId, grantId, notes ?? null]
    );
    return { applicationId: id, status: "saved", alreadyExists: false };
  }

  const supabase = createSupabaseAdmin();
  const { data: grant } = await supabase.from("grants").select("id").eq("id", grantId).single();
  if (!grant) return { error: "GRANT_NOT_FOUND" as const };

  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("user_id", userId)
    .eq("grant_id", grantId)
    .maybeSingle();

  if (existing) {
    return { applicationId: existing.id, status: existing.status, alreadyExists: true };
  }

  const { data: application, error } = await supabase
    .from("applications")
    .insert({ user_id: userId, grant_id: grantId, status: "saved", notes: notes ?? null })
    .select("id, status")
    .single();

  if (error) throw new Error(error.message);
  return { applicationId: application.id, status: application.status, alreadyExists: false };
}

export async function getApplicationForUser(userId: string, applicationId: string) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, status, user_id FROM applications WHERE id = $1::uuid`,
      [applicationId]
    );
    const row = result.rows[0];
    if (!row) return null;
    if (String(row.user_id) !== userId) return { forbidden: true as const };
    return { id: String(row.id), status: String(row.status), grant_id: null as string | null };
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("applications")
    .select("id, status, user_id, grant_id")
    .eq("id", applicationId)
    .single();
  if (!data) return null;
  if (data.user_id !== userId) return { forbidden: true as const };
  return data;
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  update: { status?: string; notes?: string | null }
) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const fields: string[] = ["updated_at = now()"];
    const values: unknown[] = [];
    let i = 1;

    if (update.status !== undefined) {
      fields.push(`status = $${i}`);
      values.push(update.status);
      i++;
    }
    if (update.notes !== undefined) {
      fields.push(`notes = $${i}`);
      values.push(update.notes);
      i++;
    }

    values.push(applicationId, userId);
    const result = await pool.query(
      `UPDATE applications SET ${fields.join(", ")}
       WHERE id = $${i}::uuid AND user_id = $${i + 1}::uuid
       RETURNING id, status`,
      values
    );
    if (!result.rows[0]) return null;
    return { id: String(result.rows[0].id), status: String(result.rows[0].status) };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select("id, status")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteApplication(userId: string, applicationId: string) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `DELETE FROM applications WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id`,
      [applicationId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("applications").delete().eq("id", applicationId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return true;
}

function mapApplicationRow(r: Record<string, unknown>): ApplicationRow {
  return {
    id: String(r.id),
    status: String(r.status),
    notes: r.notes ? String(r.notes) : null,
    created_at: new Date(String(r.created_at)).toISOString(),
    updated_at: new Date(String(r.updated_at)).toISOString(),
    grant: r.grant_id
      ? {
          id: String(r.grant_id),
          title: String(r.title),
          title_ru: r.title_ru ? String(r.title_ru) : null,
          deadline: r.deadline ? new Date(String(r.deadline)).toISOString() : null,
          amount_min: r.amount_min != null ? Number(r.amount_min) : null,
          amount_max: r.amount_max != null ? Number(r.amount_max) : null,
          donor: {
            name: r.donor_name ? String(r.donor_name) : null,
            name_ru: r.donor_name_ru ? String(r.donor_name_ru) : null,
          },
        }
      : null,
  };
}
