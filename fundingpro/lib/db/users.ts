import { withDatabase } from "@/lib/db/runtime";
import { getUserOrganizationDetails } from "@/lib/db/organizations";

export type InternalUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  isNew: boolean;
};

type EnsureUserParams = {
  supabaseId: string;
  email: string | null;
  emailVerified?: boolean;
  provider?: string;
};

/**
 * Ensure internal users row exists for a Supabase Auth user.
 * user.id === supabase auth id for simple mapping.
 */
export async function ensureInternalUser(params: EnsureUserParams): Promise<InternalUser> {
  const provider = params.provider ?? "supabase_email";
  const emailVerified = params.emailVerified ?? false;

  return withDatabase(
    async (pool) => {
      const existing = await pool.query(
        `SELECT id, email, email_verified, is_active, created_at
         FROM users WHERE id = $1::uuid`,
        [params.supabaseId]
      );

      if (existing.rows[0]) {
        const row = existing.rows[0];
        return {
          id: String(row.id),
          email: row.email ? String(row.email) : null,
          emailVerified: Boolean(row.email_verified),
          isActive: Boolean(row.is_active),
          createdAt: new Date(String(row.created_at)).toISOString(),
          isNew: false,
        };
      }

      await pool.query(
        `INSERT INTO users (id, email, email_verified, is_active)
         VALUES ($1::uuid, $2, $3, true)`,
        [params.supabaseId, params.email, emailVerified]
      );

      await pool.query(
        `INSERT INTO user_identities (user_id, provider, provider_id)
         VALUES ($1::uuid, $2, $3)
         ON CONFLICT (provider, provider_id) DO NOTHING`,
        [params.supabaseId, provider, params.supabaseId]
      );

      const created = await pool.query(
        `SELECT id, email, email_verified, is_active, created_at FROM users WHERE id = $1::uuid`,
        [params.supabaseId]
      );
      const row = created.rows[0];
      return {
        id: String(row.id),
        email: row.email ? String(row.email) : null,
        emailVerified: Boolean(row.email_verified),
        isActive: Boolean(row.is_active),
        createdAt: new Date(String(row.created_at)).toISOString(),
        isNew: true,
      };
    },
    async (supabase) => {
      const { data: existing } = await supabase
        .from("users")
        .select("id, email, email_verified, is_active, created_at")
        .eq("id", params.supabaseId)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id,
          email: existing.email,
          emailVerified: existing.email_verified,
          isActive: existing.is_active,
          createdAt: existing.created_at,
          isNew: false,
        };
      }

      const { data: created, error } = await supabase
        .from("users")
        .insert({
          id: params.supabaseId,
          email: params.email,
          email_verified: emailVerified,
          is_active: true,
        })
        .select("id, email, email_verified, is_active, created_at")
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("user_identities").upsert(
        {
          user_id: params.supabaseId,
          provider,
          provider_id: params.supabaseId,
        },
        { onConflict: "provider,provider_id" }
      );

      return {
        id: created.id,
        email: created.email,
        emailVerified: created.email_verified,
        isActive: created.is_active,
        createdAt: created.created_at,
        isNew: true,
      };
    }
  );
}

export async function getUserOrganization(userId: string) {
  return getUserOrganizationDetails(userId);
}

export async function getUserSubscription(userId: string) {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT s.id, s.status, s.start_date, s.end_date,
                p.id AS plan_id, p.name, p.name_ru, p.price_usd
         FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.user_id = $1::uuid AND s.status = 'ACTIVE'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [userId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        id: String(row.id),
        status: String(row.status),
        startDate: row.start_date ? new Date(String(row.start_date)).toISOString() : null,
        endDate: row.end_date ? new Date(String(row.end_date)).toISOString() : null,
        plan: {
          id: String(row.plan_id),
          name: String(row.name),
          nameRu: row.name_ru ? String(row.name_ru) : null,
          priceUsd: Number(row.price_usd),
        },
      };
    },
    async (supabase) => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, status, start_date, end_date, plan:plans ( id, name, name_ru, price_usd )")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      const plan = data.plan as unknown as { id: string; name: string; name_ru: string | null; price_usd: number } | null;
      return {
        id: data.id,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        plan: plan
          ? { id: plan.id, name: plan.name, nameRu: plan.name_ru, priceUsd: plan.price_usd }
          : null,
      };
    }
  );
}
