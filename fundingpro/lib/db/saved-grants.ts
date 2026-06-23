import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function listSavedGrantIds(userId: string): Promise<string[]> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT grant_id FROM saved_grants WHERE user_id = $1::uuid`,
      [userId]
    );
    return result.rows.map((r) => String(r.grant_id));
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("saved_grants")
    .select("grant_id")
    .eq("user_id", userId);

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((r) => r.grant_id);
}

export async function saveGrant(userId: string, grantId: string): Promise<{ saved: boolean }> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO saved_grants (user_id, grant_id)
       VALUES ($1::uuid, $2::uuid)
       ON CONFLICT (user_id, grant_id) DO NOTHING`,
      [userId, grantId]
    );
    return { saved: true };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("saved_grants")
    .upsert({ user_id: userId, grant_id: grantId }, { onConflict: "user_id,grant_id" });

  if (error) throw new Error(error.message);
  return { saved: true };
}

export async function unsaveGrant(userId: string, grantId: string): Promise<{ saved: boolean }> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `DELETE FROM saved_grants WHERE user_id = $1::uuid AND grant_id = $2::uuid`,
      [userId, grantId]
    );
    return { saved: false };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("saved_grants")
    .delete()
    .eq("user_id", userId)
    .eq("grant_id", grantId);

  if (error) throw new Error(error.message);
  return { saved: false };
}

export async function isGrantSaved(userId: string, grantId: string): Promise<boolean> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT 1 FROM saved_grants WHERE user_id = $1::uuid AND grant_id = $2::uuid LIMIT 1`,
      [userId, grantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("saved_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("grant_id", grantId)
    .maybeSingle();

  if (error && error.code === "42P01") return false;
  if (error) throw new Error(error.message);
  return !!data;
}
