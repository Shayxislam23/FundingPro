import { withDatabase } from "@/lib/db/runtime";

export type PlatformRole = "user" | "admin";

export async function getUserPlatformRole(userId: string): Promise<PlatformRole> {
  try {
    return await withDatabase(
      async (pool) => {
        const result = await pool.query(
          `SELECT platform_role FROM users WHERE id = $1::uuid AND deleted_at IS NULL`,
          [userId]
        );
        const role = result.rows[0]?.platform_role;
        return role === "admin" ? "admin" : "user";
      },
      async (supabase) => {
        const { data } = await supabase
          .from("users")
          .select("platform_role")
          .eq("id", userId)
          .is("deleted_at", null)
          .maybeSingle();

        return data?.platform_role === "admin" ? "admin" : "user";
      }
    );
  } catch {
    return "user";
  }
}
