import { withDatabase } from "@/lib/db/runtime";
import type { ConsentType, LegalLocale } from "@/lib/legal/types";

export type AdminConsentRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  consentType: ConsentType;
  documentVersion: string;
  acceptedAt: string;
  locale: LegalLocale;
};

export async function listRecentConsents(limit: number): Promise<AdminConsentRow[]> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT uc.id, uc.user_id, u.email AS user_email,
                uc.consent_type, uc.document_version, uc.accepted_at, uc.locale
         FROM user_consents uc
         LEFT JOIN users u ON u.id = uc.user_id
         ORDER BY uc.accepted_at DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        userEmail: row.user_email ? String(row.user_email) : null,
        consentType: String(row.consent_type) as ConsentType,
        documentVersion: String(row.document_version),
        acceptedAt: new Date(String(row.accepted_at)).toISOString(),
        locale: String(row.locale) as LegalLocale,
      }));
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("user_consents")
        .select("id, user_id, consent_type, document_version, accepted_at, locale, user:users ( email )")
        .order("accepted_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => {
        const user = row.user as unknown as { email: string | null } | null;
        return {
          id: row.id,
          userId: row.user_id,
          userEmail: user?.email ?? null,
          consentType: row.consent_type as ConsentType,
          documentVersion: row.document_version,
          acceptedAt: row.accepted_at,
          locale: row.locale as LegalLocale,
        };
      });
    }
  );
}
