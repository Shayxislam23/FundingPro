import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type OrganizationRow = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  isVerified: boolean;
  memberCount: number;
  readinessScore: number;
  createdAt: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  sector: string | null;
  role: string;
  isVerified: boolean;
};

export async function getUserOrganizationDetails(userId: string): Promise<UserOrganization | null> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT o.id, o.name, o.type, o.country, o.sector, o.is_verified, om.role
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = $1::uuid AND o.deleted_at IS NULL
       ORDER BY om.created_at ASC
       LIMIT 1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      name: String(row.name),
      type: String(row.type),
      country: row.country ? String(row.country) : null,
      sector: row.sector ? String(row.sector) : null,
      role: String(row.role),
      isVerified: Boolean(row.is_verified),
    };
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations ( id, name, type, country, sector, is_verified )")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!data?.organization) return null;
  const org = data.organization as unknown as {
    id: string;
    name: string;
    type: string;
    country: string | null;
    sector: string | null;
    is_verified: boolean;
  };
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    country: org.country,
    sector: org.sector,
    role: data.role,
    isVerified: org.is_verified,
  };
}

export async function createOrganizationForUser(
  userId: string,
  input: {
    name: string;
    type: string;
    country?: string;
    sector?: string;
    description?: string;
  }
) {
  const existing = await getUserOrganizationDetails(userId);
  if (existing) {
    return { error: "ALREADY_HAS_ORG" as const, organization: existing };
  }

  const orgId = crypto.randomUUID();

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO organizations (id, name, type, country, sector, description, is_verified)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, false)`,
      [orgId, input.name, input.type, input.country ?? null, input.sector ?? null, input.description ?? null]
    );
    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1::uuid, $2::uuid, 'ADMIN')`,
      [orgId, userId]
    );
  } else {
    const supabase = createSupabaseAdmin();
    const { error: orgError } = await supabase.from("organizations").insert({
      id: orgId,
      name: input.name,
      type: input.type,
      country: input.country ?? null,
      sector: input.sector ?? null,
      description: input.description ?? null,
      is_verified: false,
    });
    if (orgError) throw new Error(orgError.message);

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: orgId,
      user_id: userId,
      role: "ADMIN",
    });
    if (memberError) throw new Error(memberError.message);
  }

  const organization = await getUserOrganizationDetails(userId);
  return { organization };
}

export async function updateOrganizationForUser(
  userId: string,
  input: {
    name?: string;
    type?: string;
    country?: string;
    sector?: string;
    description?: string;
  }
): Promise<UserOrganization | null> {
  const existing = await getUserOrganizationDetails(userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(input.name);
  }
  if (input.type !== undefined) {
    updates.push(`type = $${i++}`);
    values.push(input.type);
  }
  if (input.country !== undefined) {
    updates.push(`country = $${i++}`);
    values.push(input.country);
  }
  if (input.sector !== undefined) {
    updates.push(`sector = $${i++}`);
    values.push(input.sector);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${i++}`);
    values.push(input.description);
  }

  if (updates.length === 0) return existing;

  values.push(existing.id);

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `UPDATE organizations SET ${updates.join(", ")}, updated_at = now() WHERE id = $${i}::uuid`,
      values
    );
  } else {
    const supabase = createSupabaseAdmin();
    const patch: Record<string, string | null> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.type !== undefined) patch.type = input.type;
    if (input.country !== undefined) patch.country = input.country;
    if (input.sector !== undefined) patch.sector = input.sector;
    if (input.description !== undefined) patch.description = input.description;
    const { error } = await supabase.from("organizations").update(patch).eq("id", existing.id);
    if (error) throw new Error(error.message);
  }

  return getUserOrganizationDetails(userId);
}

export async function setOrganizationVerified(orgId: string, verified: boolean): Promise<void> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(`UPDATE organizations SET is_verified = $2 WHERE id = $1::uuid`, [
      orgId,
      verified,
    ]);
    return;
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("organizations")
    .update({ is_verified: verified })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}

export async function listOrganizations(limit = 50): Promise<OrganizationRow[]> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT o.id, o.name, o.type, o.country, o.sector, o.is_verified, o.created_at,
              COUNT(om.user_id)::int AS member_count,
              COALESCE(AVG(CASE WHEN a.status IN ('submitted', 'approved') THEN 80 ELSE 40 END), 0)::int AS readiness_score
       FROM organizations o
       LEFT JOIN organization_members om ON om.organization_id = o.id
       LEFT JOIN applications a ON a.organization_id = o.id
       WHERE o.deleted_at IS NULL
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      type: String(row.type),
      country: row.country ? String(row.country) : null,
      sector: row.sector ? String(row.sector) : null,
      isVerified: Boolean(row.is_verified),
      memberCount: Number(row.member_count ?? 0),
      readinessScore: Number(row.readiness_score ?? 0),
      createdAt: new Date(String(row.created_at)).toISOString(),
    }));
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, type, country, sector, is_verified, created_at, organization_members(count)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const members = row.organization_members as unknown as { count: number }[] | null;
    const memberCount = Array.isArray(members) ? members.length : 0;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      country: row.country,
      sector: row.sector,
      isVerified: row.is_verified,
      memberCount,
      readinessScore: 0,
      createdAt: row.created_at,
    };
  });
}
