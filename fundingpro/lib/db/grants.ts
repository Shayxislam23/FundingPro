import { getPgPool } from "@/lib/pg-pool";

export type GrantListItem = {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  sectors: string[];
  country_scope: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  donor: { id: string; name: string; name_ru: string | null };
};

export type GrantDetail = GrantListItem & {
  description_ru: string | null;
  grant_requirements: {
    id: string;
    requirement_type: string;
    text: string;
    required: boolean;
  }[];
  donor: { id: string; name: string; name_ru: string | null; website: string | null };
};

type ListParams = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  featured?: boolean;
  page: number;
  limit: number;
};

function mapGrantRow(row: Record<string, unknown>): GrantListItem {
  const donor = row.donor as Record<string, unknown> | null;
  return {
    id: String(row.id),
    title: String(row.title),
    title_ru: row.title_ru ? String(row.title_ru) : null,
    description: row.description ? String(row.description) : null,
    sectors: (row.sectors as string[]) ?? [],
    country_scope: (row.country_scope as string[]) ?? [],
    amount_min: row.amount_min != null ? Number(row.amount_min) : null,
    amount_max: row.amount_max != null ? Number(row.amount_max) : null,
    deadline: row.deadline ? new Date(String(row.deadline)).toISOString() : null,
    donor: {
      id: donor?.id ? String(donor.id) : "",
      name: donor?.name ? String(donor.name) : "",
      name_ru: donor?.name_ru ? String(donor.name_ru) : null,
    },
  };
}

export async function listGrants(params: ListParams) {
  const pool = getPgPool();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (params.search) {
    conditions.push(
      `(g.title ILIKE $${i} OR g.description ILIKE $${i} OR g.title_ru ILIKE $${i})`
    );
    values.push(`%${params.search}%`);
    i++;
  }
  if (params.sector) {
    conditions.push(`$${i} = ANY(g.sectors)`);
    values.push(params.sector);
    i++;
  }
  if (params.country) {
    conditions.push(`$${i} = ANY(g.country_scope)`);
    values.push(params.country);
    i++;
  }
  if (params.donorId) {
    conditions.push(`g.donor_id = $${i}::uuid`);
    values.push(params.donorId);
    i++;
  }
  if (params.deadlineBefore) {
    conditions.push(`g.deadline IS NOT NULL AND g.deadline <= $${i}::timestamptz`);
    values.push(params.deadlineBefore);
    i++;
  }
  if (params.featured) {
    conditions.push(`g.featured = true`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (params.page - 1) * params.limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM grants g ${where}`,
    values
  );
  const total = countResult.rows[0]?.total ?? 0;

  const listResult = await pool.query(
    `SELECT g.id, g.title, g.title_ru, g.description, g.sectors, g.country_scope,
            g.amount_min, g.amount_max, g.deadline,
            json_build_object(
              'id', d.id,
              'name', d.name,
              'name_ru', d.name_ru
            ) AS donor
     FROM grants g
     LEFT JOIN donors d ON d.id = g.donor_id
     ${where}
     ORDER BY g.deadline ASC NULLS LAST
     LIMIT $${i} OFFSET $${i + 1}`,
    [...values, params.limit, offset]
  );

  return {
    grants: listResult.rows.map(mapGrantRow),
    total,
    page: params.page,
    limit: params.limit,
    pages: Math.ceil(total / params.limit),
  };
}

export async function getGrantById(id: string): Promise<GrantDetail | null> {
  const pool = getPgPool();

  const grantResult = await pool.query(
    `SELECT g.id, g.title, g.title_ru, g.description, g.description_ru,
            g.sectors, g.country_scope, g.amount_min, g.amount_max, g.deadline,
            json_build_object(
              'id', d.id,
              'name', d.name,
              'name_ru', d.name_ru,
              'website', d.website
            ) AS donor
     FROM grants g
     LEFT JOIN donors d ON d.id = g.donor_id
     WHERE g.id = $1::uuid`,
    [id]
  );

  if (!grantResult.rows[0]) return null;

  const reqResult = await pool.query(
    `SELECT id, requirement_type, text, required
     FROM grant_requirements
     WHERE grant_id = $1::uuid
     ORDER BY created_at ASC`,
    [id]
  );

  const base = mapGrantRow(grantResult.rows[0]);
  const row = grantResult.rows[0];
  const donor = row.donor as Record<string, unknown>;

  return {
    ...base,
    description_ru: row.description_ru ? String(row.description_ru) : null,
    donor: {
      id: donor?.id ? String(donor.id) : "",
      name: donor?.name ? String(donor.name) : "",
      name_ru: donor?.name_ru ? String(donor.name_ru) : null,
      website: donor?.website ? String(donor.website) : null,
    },
    grant_requirements: reqResult.rows.map((r) => ({
      id: String(r.id),
      requirement_type: String(r.requirement_type),
      text: String(r.text),
      required: Boolean(r.required),
    })),
  };
}

export async function grantsHealthCheck(): Promise<void> {
  const pool = getPgPool();
  await pool.query("SELECT id FROM grants LIMIT 1");
}
