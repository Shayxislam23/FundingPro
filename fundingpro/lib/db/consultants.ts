import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function listConsultants(opts: {
  specialty?: string;
  country?: string;
  page: number;
  limit: number;
}) {
  const offset = (opts.page - 1) * opts.limit;

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const conditions = ["is_verified = true", "is_active = true"];
    const values: unknown[] = [];
    let i = 1;

    if (opts.country) {
      conditions.push(`country = $${i}`);
      values.push(opts.country);
      i++;
    }
    if (opts.specialty) {
      conditions.push(`$${i} = ANY(specialties)`);
      values.push(opts.specialty);
      i++;
    }

    const where = conditions.join(" AND ");
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM consultant_profiles WHERE ${where}`,
      values
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await pool.query(
      `SELECT * FROM consultant_profiles WHERE ${where}
       ORDER BY rating DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, opts.limit, offset]
    );

    return {
      consultants: result.rows.map((r) => ({
        ...r,
        rating: Number(r.rating),
      })),
      total,
      page: opts.page,
      limit: opts.limit,
      pages: Math.ceil(total / opts.limit),
    };
  }

  const supabase = createSupabaseAdmin();
  const from = offset;
  const to = from + opts.limit - 1;

  let query = supabase
    .from("consultant_profiles")
    .select("*", { count: "exact" })
    .eq("is_verified", true)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .range(from, to);

  if (opts.country) query = query.eq("country", opts.country);
  if (opts.specialty) query = query.contains("specialties", [opts.specialty]);

  const { data, count, error } = await query;
  if (error) {
    if (error.code === "42P01") return { consultants: [], total: 0, page: opts.page, limit: opts.limit, pages: 0 };
    throw new Error(error.message);
  }

  const total = count ?? 0;
  return {
    consultants: data ?? [],
    total,
    page: opts.page,
    limit: opts.limit,
    pages: Math.ceil(total / opts.limit),
  };
}
