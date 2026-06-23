import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type AdminGrantRow = {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  donor_id: string;
  donor_name: string | null;
  sectors: string[];
  country_scope: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

export type GrantInput = {
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  donorId: string;
  sectors?: string[];
  countryScope?: string[];
  applicantTypes?: string[];
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: string | null;
  sourceUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export async function listAdminGrants(params: { search?: string; page: number; limit: number }) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (params.search) {
      conditions.push(`(g.title ILIKE $${i} OR g.title_ru ILIKE $${i})`);
      values.push(`%${params.search}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (params.page - 1) * params.limit;

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM grants g ${where}`, values);
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT g.id, g.title, g.title_ru, g.description, g.donor_id, g.sectors, g.country_scope,
              g.amount_min, g.amount_max, g.deadline, g.is_active, g.is_featured, g.created_at,
              d.name AS donor_name
       FROM grants g
       LEFT JOIN donors d ON d.id = g.donor_id
       ${where}
       ORDER BY g.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, params.limit, offset]
    );

    return {
      grants: result.rows.map(mapAdminGrant),
      total,
      page: params.page,
      limit: params.limit,
      pages: Math.ceil(total / params.limit),
    };
  }

  const supabase = createSupabaseAdmin();
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabase
    .from("grants")
    .select(
      `id, title, title_ru, description, donor_id, sectors, country_scope,
       amount_min, amount_max, deadline, is_active, is_featured, created_at,
       donor:donors ( name )`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,title_ru.ilike.%${params.search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    grants: (data ?? []).map((g) => {
      const donor = g.donor as { name: string } | { name: string }[] | null;
      const donorName = Array.isArray(donor) ? donor[0]?.name : donor?.name;
      return mapAdminGrant({ ...g, donor_name: donorName ?? null });
    }),
    total,
    page: params.page,
    limit: params.limit,
    pages: Math.ceil(total / params.limit),
  };
}

function mapAdminGrant(row: Record<string, unknown>): AdminGrantRow {
  return {
    id: String(row.id),
    title: String(row.title),
    title_ru: row.title_ru ? String(row.title_ru) : null,
    description: row.description ? String(row.description) : null,
    donor_id: String(row.donor_id),
    donor_name: row.donor_name ? String(row.donor_name) : null,
    sectors: (row.sectors as string[]) ?? [],
    country_scope: (row.country_scope as string[]) ?? [],
    amount_min: row.amount_min != null ? Number(row.amount_min) : null,
    amount_max: row.amount_max != null ? Number(row.amount_max) : null,
    deadline: row.deadline ? new Date(String(row.deadline)).toISOString() : null,
    is_active: Boolean(row.is_active ?? true),
    is_featured: Boolean(row.is_featured ?? false),
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createGrant(input: GrantInput): Promise<string> {
  const id = crypto.randomUUID();

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO grants (id, title, title_ru, description, description_ru, donor_id, sectors, country_scope,
        applicant_types, amount_min, amount_max, deadline, source_url, is_active, is_featured)
       VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        input.title,
        input.titleRu ?? null,
        input.description ?? null,
        input.descriptionRu ?? null,
        input.donorId,
        input.sectors ?? [],
        input.countryScope ?? ["Uzbekistan"],
        input.applicantTypes ?? ["NGO"],
        input.amountMin ?? null,
        input.amountMax ?? null,
        input.deadline ?? null,
        input.sourceUrl ?? null,
        input.isActive ?? true,
        input.isFeatured ?? false,
      ]
    );
    return id;
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("grants").insert({
    id,
    title: input.title,
    title_ru: input.titleRu ?? null,
    description: input.description ?? null,
    description_ru: input.descriptionRu ?? null,
    donor_id: input.donorId,
    sectors: input.sectors ?? [],
    country_scope: input.countryScope ?? ["Uzbekistan"],
    applicant_types: input.applicantTypes ?? ["NGO"],
    amount_min: input.amountMin ?? null,
    amount_max: input.amountMax ?? null,
    deadline: input.deadline ?? null,
    source_url: input.sourceUrl ?? null,
    is_active: input.isActive ?? true,
    is_featured: input.isFeatured ?? false,
  });

  if (error) throw new Error(error.message);
  return id;
}

export async function updateGrant(id: string, input: Partial<GrantInput>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.titleRu !== undefined) patch.title_ru = input.titleRu;
  if (input.description !== undefined) patch.description = input.description;
  if (input.descriptionRu !== undefined) patch.description_ru = input.descriptionRu;
  if (input.donorId !== undefined) patch.donor_id = input.donorId;
  if (input.sectors !== undefined) patch.sectors = input.sectors;
  if (input.countryScope !== undefined) patch.country_scope = input.countryScope;
  if (input.amountMin !== undefined) patch.amount_min = input.amountMin;
  if (input.amountMax !== undefined) patch.amount_max = input.amountMax;
  if (input.deadline !== undefined) patch.deadline = input.deadline;
  if (input.sourceUrl !== undefined) patch.source_url = input.sourceUrl;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const sets = Object.keys(patch).map((k, idx) => `${k} = $${idx + 2}`);
    await pool.query(
      `UPDATE grants SET ${sets.join(", ")} WHERE id = $1::uuid`,
      [id, ...Object.values(patch)]
    );
    return;
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("grants").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listDonors() {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, name, name_ru FROM donors WHERE is_active = true ORDER BY name ASC`
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      nameRu: r.name_ru ? String(r.name_ru) : null,
    }));
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("donors")
    .select("id, name, name_ru")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ id: d.id, name: d.name, nameRu: d.name_ru }));
}

export async function createDonor(input: {
  name: string;
  nameRu?: string;
  shortName?: string;
  country?: string;
  website?: string;
}) {
  const id = crypto.randomUUID();
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO donors (id, name, name_ru, short_name, country, website, is_active)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, true)`,
      [id, input.name, input.nameRu ?? null, input.shortName ?? null, input.country ?? null, input.website ?? null]
    );
    return id;
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("donors").insert({
    id,
    name: input.name,
    name_ru: input.nameRu ?? null,
    short_name: input.shortName ?? null,
    country: input.country ?? null,
    website: input.website ?? null,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  return id;
}

export async function listGrantRequirements(grantId: string) {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, requirement_type, text, required FROM grant_requirements WHERE grant_id = $1::uuid ORDER BY created_at`,
      [grantId]
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      requirementType: String(r.requirement_type),
      text: String(r.text),
      required: Boolean(r.required),
    }));
  }
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("grant_requirements")
    .select("id, requirement_type, text, required")
    .eq("grant_id", grantId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    requirementType: r.requirement_type,
    text: r.text,
    required: r.required,
  }));
}

export async function addGrantRequirement(grantId: string, input: { text: string; requirementType?: string; required?: boolean }) {
  const id = crypto.randomUUID();
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO grant_requirements (id, grant_id, requirement_type, text, required)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
      [id, grantId, input.requirementType ?? "general", input.text, input.required ?? true]
    );
    return id;
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("grant_requirements").insert({
    id,
    grant_id: grantId,
    requirement_type: input.requirementType ?? "general",
    text: input.text,
    required: input.required ?? true,
  });
  if (error) throw new Error(error.message);
  return id;
}
