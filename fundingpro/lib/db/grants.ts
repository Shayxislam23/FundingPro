import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pool } from "pg";
import { getPgPool } from "@/lib/pg-pool";
import { withDatabase } from "@/lib/db/runtime";

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

export type ListGrantsParams = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  featured?: boolean;
  page: number;
  limit: number;
};

export type ListGrantsResult = {
  grants: GrantListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const GRANT_LIST_SELECT = `
  id,
  title,
  title_ru,
  description,
  sectors,
  country_scope,
  amount_min,
  amount_max,
  deadline,
  donor:donors ( id, name, name_ru )
`;

const GRANT_DETAIL_SELECT = `
  id,
  title,
  title_ru,
  description,
  description_ru,
  sectors,
  country_scope,
  amount_min,
  amount_max,
  deadline,
  donor:donors ( id, name, name_ru, website ),
  grant_requirements ( id, requirement_type, text, required )
`;

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

async function listGrantsPg(pool: Pool, params: ListGrantsParams): Promise<ListGrantsResult> {
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

async function listGrantsSupabase(
  supabase: SupabaseClient,
  params: ListGrantsParams
): Promise<ListGrantsResult> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabase
    .from("grants")
    .select(GRANT_LIST_SELECT, { count: "exact" })
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }
  if (params.sector) {
    query = query.contains("sectors", [params.sector]);
  }
  if (params.country) {
    query = query.contains("country_scope", [params.country]);
  }
  if (params.donorId) {
    query = query.eq("donor_id", params.donorId);
  }
  if (params.deadlineBefore) {
    query = query.lte("deadline", params.deadlineBefore);
  }
  if (params.featured) {
    query = query.eq("featured", true);
  }

  const { data: grants, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    grants: (grants ?? []) as unknown as GrantListItem[],
    total,
    page: params.page,
    limit: params.limit,
    pages: Math.ceil(total / params.limit),
  };
}

async function getGrantByIdPg(pool: Pool, id: string): Promise<GrantDetail | null> {
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

async function getGrantByIdSupabase(
  supabase: SupabaseClient,
  id: string
): Promise<GrantDetail | null> {
  const { data: grant, error } = await supabase
    .from("grants")
    .select(GRANT_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error || !grant) return null;
  return grant as unknown as GrantDetail;
}

export async function listGrants(params: ListGrantsParams): Promise<ListGrantsResult> {
  return withDatabase(
    (pool) => listGrantsPg(pool, params),
    (supabase) => listGrantsSupabase(supabase, params)
  );
}

export async function getGrantById(id: string): Promise<GrantDetail | null> {
  return withDatabase(
    (pool) => getGrantByIdPg(pool, id),
    (supabase) => getGrantByIdSupabase(supabase, id)
  );
}

export async function grantsHealthCheck(): Promise<void> {
  await withDatabase(
    async (pool) => {
      await pool.query("SELECT id FROM grants LIMIT 1");
    },
    async (supabase) => {
      const { error } = await supabase.from("grants").select("id").limit(1);
      if (error) throw new Error(error.message);
    }
  );
}

/** @deprecated use getPgPool via withDatabase */
export function getGrantsPgPool(): Pool {
  return getPgPool();
}
