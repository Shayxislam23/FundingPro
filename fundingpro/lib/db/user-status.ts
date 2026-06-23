import { withDatabase } from "@/lib/db/runtime";

export type UserAccountStatus = {
  isActive: boolean;
  isBanned: boolean;
};

export async function getUserAccountStatus(userId: string): Promise<UserAccountStatus> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT is_active, is_banned FROM users WHERE id = $1::uuid AND deleted_at IS NULL`,
        [userId]
      );
      const row = result.rows[0];
      if (!row) {
        return { isActive: false, isBanned: false };
      }
      return {
        isActive: Boolean(row.is_active),
        isBanned: Boolean(row.is_banned),
      };
    },
    async (supabase) => {
      const { data } = await supabase
        .from("users")
        .select("is_active, is_banned")
        .eq("id", userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!data) {
        return { isActive: false, isBanned: false };
      }
      return {
        isActive: data.is_active,
        isBanned: data.is_banned,
      };
    }
  );
}
