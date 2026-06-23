import { withDatabase } from "@/lib/db/runtime";

export type AdminApplicationRow = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string | null;
  organizationName: string | null;
  grant: {
    id: string;
    title: string;
    titleRu: string | null;
    donorName: string | null;
  } | null;
};

export async function listApplicationsForAdmin(opts: {
  limit: number;
  status?: string;
}): Promise<{ applications: AdminApplicationRow[]; total: number }> {
  return withDatabase(
    async (pool) => {
      const conditions: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (opts.status) {
        conditions.push(`a.status = $${i}`);
        values.push(opts.status);
        i++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM applications a ${where}`,
        values
      );
      const total = Number(countResult.rows[0]?.total ?? 0);

      const result = await pool.query(
        `SELECT a.id, a.status, a.notes, a.created_at, a.updated_at, a.user_id,
                u.email AS user_email, o.name AS organization_name,
                g.id AS grant_id, g.title, g.title_ru,
                d.name AS donor_name
         FROM applications a
         LEFT JOIN users u ON u.id = a.user_id
         LEFT JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN grants g ON g.id = a.grant_id
         LEFT JOIN donors d ON d.id = g.donor_id
         ${where}
         ORDER BY a.updated_at DESC
         LIMIT $${i}`,
        [...values, opts.limit]
      );

      return {
        applications: result.rows.map(mapAdminApplicationRow),
        total,
      };
    },
    async (supabase) => {
      let query = supabase
        .from("applications")
        .select(
          `id, status, notes, created_at, updated_at, user_id,
           user:users ( email ),
           organization:organizations ( name ),
           grant:grants ( id, title, title_ru, donor:donors ( name ) )`,
          { count: "exact" }
        )
        .order("updated_at", { ascending: false })
        .limit(opts.limit);

      if (opts.status) query = query.eq("status", opts.status);

      const { data, count, error } = await query;
      if (error) throw new Error(error.message);

      const applications = (data ?? []).map((row) => {
        const user = row.user as unknown as { email: string | null } | null;
        const org = row.organization as unknown as { name: string } | null;
        const grantRaw = row.grant as unknown as {
          id: string;
          title: string;
          title_ru: string | null;
          donor: { name: string | null } | null;
        } | null;

        return {
          id: row.id,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          userId: row.user_id,
          userEmail: user?.email ?? null,
          organizationName: org?.name ?? null,
          grant: grantRaw
            ? {
                id: grantRaw.id,
                title: grantRaw.title,
                titleRu: grantRaw.title_ru,
                donorName: grantRaw.donor?.name ?? null,
              }
            : null,
        } satisfies AdminApplicationRow;
      });

      return { applications, total: count ?? applications.length };
    }
  );
}

function mapAdminApplicationRow(r: Record<string, unknown>): AdminApplicationRow {
  return {
    id: String(r.id),
    status: String(r.status),
    notes: r.notes ? String(r.notes) : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    userId: String(r.user_id),
    userEmail: r.user_email ? String(r.user_email) : null,
    organizationName: r.organization_name ? String(r.organization_name) : null,
    grant: r.grant_id
      ? {
          id: String(r.grant_id),
          title: String(r.title),
          titleRu: r.title_ru ? String(r.title_ru) : null,
          donorName: r.donor_name ? String(r.donor_name) : null,
        }
      : null,
  };
}
