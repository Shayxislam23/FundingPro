import { withDatabase } from "@/lib/db/runtime";
import {
  getConsentVersion,
  getLegalManifest,
} from "@/lib/legal/documents";
import type { ConsentType, LegalLocale } from "@/lib/legal/types";

export type ConsentRecord = {
  consentType: ConsentType;
  documentVersion: string;
  acceptedAt: string;
  locale: LegalLocale;
};

const REQUIRED_CONSENTS: ConsentType[] = ["terms", "privacy"];

export function getRequiredConsentTypes(): ConsentType[] {
  return [...REQUIRED_CONSENTS];
}

export async function recordConsents(
  userId: string,
  consents: Array<{ consentType: ConsentType; documentVersion: string; locale?: LegalLocale }>
): Promise<void> {
  if (consents.length === 0) return;

  await withDatabase(
    async (pool) => {
      for (const c of consents) {
        await pool.query(
          `INSERT INTO user_consents (user_id, consent_type, document_version, locale)
           VALUES ($1::uuid, $2, $3, $4)
           ON CONFLICT (user_id, consent_type, document_version) DO NOTHING`,
          [userId, c.consentType, c.documentVersion, c.locale ?? "ru"]
        );
      }
    },
    async (supabase) => {
      const rows = consents.map((c) => ({
        user_id: userId,
        consent_type: c.consentType,
        document_version: c.documentVersion,
        locale: c.locale ?? "ru",
      }));
      await supabase.from("user_consents").upsert(rows, {
        onConflict: "user_id,consent_type,document_version",
        ignoreDuplicates: true,
      });
    }
  );
}

export async function listUserConsents(userId: string): Promise<ConsentRecord[]> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT consent_type, document_version, accepted_at, locale
         FROM user_consents WHERE user_id = $1::uuid
         ORDER BY accepted_at DESC`,
        [userId]
      );
      return result.rows.map((row) => ({
        consentType: String(row.consent_type) as ConsentType,
        documentVersion: String(row.document_version),
        acceptedAt: new Date(String(row.accepted_at)).toISOString(),
        locale: String(row.locale) as LegalLocale,
      }));
    },
    async (supabase) => {
      const { data } = await supabase
        .from("user_consents")
        .select("consent_type, document_version, accepted_at, locale")
        .eq("user_id", userId)
        .order("accepted_at", { ascending: false });
      return (data ?? []).map((row) => ({
        consentType: row.consent_type as ConsentType,
        documentVersion: row.document_version,
        acceptedAt: row.accepted_at,
        locale: row.locale as LegalLocale,
      }));
    }
  );
}

export async function hasCurrentConsents(userId: string): Promise<{
  ok: boolean;
  missing: ConsentType[];
  needsReconsent: boolean;
}> {
  const records = await listUserConsents(userId);
  const latestByType = new Map<ConsentType, string>();
  for (const r of records) {
    if (!latestByType.has(r.consentType)) {
      latestByType.set(r.consentType, r.documentVersion);
    }
  }

  const missing: ConsentType[] = [];
  for (const type of REQUIRED_CONSENTS) {
    const current = getConsentVersion(type);
    const accepted = latestByType.get(type);
    if (!accepted || accepted !== current) {
      missing.push(type);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    needsReconsent: missing.length > 0,
  };
}

export async function assertPaymentConsents(userId: string): Promise<void> {
  const status = await hasCurrentConsents(userId);
  if (!status.ok) {
    throw new Error("LEGAL_CONSENT_REQUIRED");
  }
}

export function getConsentManifest() {
  return getLegalManifest();
}
