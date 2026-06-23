import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type GrantMatch = {
  grantId: string;
  title: string;
  titleRu: string | null;
  score: number;
  reason: string;
  donorName: string | null;
  deadline: string | null;
};

const SECTOR_MAP: Record<string, string[]> = {
  environment: ["environment", "climate", "biodiversity", "water"],
  education: ["education", "youth", "research"],
  agriculture: ["agriculture", "rural", "biotech"],
  business: ["economy", "business", "trade", "innovation"],
  healthcare: ["healthcare", "social"],
  governance: ["governance", "civil_society", "human_rights", "media"],
};

function normalizeSector(value: string): string[] {
  const key = value.toLowerCase();
  for (const [profileKey, sectors] of Object.entries(SECTOR_MAP)) {
    if (key.includes(profileKey) || sectors.some((s) => key.includes(s))) {
      return sectors;
    }
  }
  return [key];
}

export async function matchGrantsFromDatabase(profile: Record<string, unknown>, limit = 10): Promise<GrantMatch[]> {
  const sectorRaw = String(profile.sector ?? profile.sectors ?? "");
  const countryRaw = String(profile.country ?? profile.country_scope ?? "Uzbekistan");
  const orgType = String(profile.org_type ?? profile.type ?? "NGO");

  const sectorTerms = sectorRaw ? normalizeSector(sectorRaw) : [];
  const country = countryRaw || "Uzbekistan";

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT g.id, g.title, g.title_ru, g.sectors, g.country_scope, g.applicant_types, g.deadline,
              d.name_ru AS donor_name_ru, d.name AS donor_name
       FROM grants g
       LEFT JOIN donors d ON d.id = g.donor_id
       WHERE g.is_active = true
       ORDER BY g.is_featured DESC, g.deadline ASC NULLS LAST
       LIMIT 100`
    );

    return scoreGrants(result.rows, { sectorTerms, country, orgType }).slice(0, limit);
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("grants")
    .select("id, title, title_ru, sectors, country_scope, applicant_types, deadline, donor:donors ( name, name_ru )")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((g) => {
    const donor = g.donor as unknown as { name: string; name_ru: string | null } | null;
    return {
      id: g.id,
      title: g.title,
      title_ru: g.title_ru,
      sectors: g.sectors,
      country_scope: g.country_scope,
      applicant_types: g.applicant_types,
      deadline: g.deadline,
      donor_name: donor?.name ?? null,
      donor_name_ru: donor?.name_ru ?? null,
    };
  });

  return scoreGrants(rows, { sectorTerms, country, orgType }).slice(0, limit);
}

function scoreGrants(
  rows: Record<string, unknown>[],
  ctx: { sectorTerms: string[]; country: string; orgType: string }
): GrantMatch[] {
  const scored = rows.map((row) => {
    let score = 40;
    const reasons: string[] = [];

    const sectors = (row.sectors as string[]) ?? [];
    const countries = (row.country_scope as string[]) ?? [];
    const applicantTypes = (row.applicant_types as string[]) ?? [];

    if (ctx.sectorTerms.length > 0) {
      const sectorHit = ctx.sectorTerms.some((t) =>
        sectors.some((s) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))
      );
      if (sectorHit) {
        score += 25;
        reasons.push("Совпадение по сектору");
      }
    }

    if (countries.some((c) => c.toLowerCase().includes(ctx.country.toLowerCase()) || ctx.country.toLowerCase().includes(c.toLowerCase()))) {
      score += 20;
      reasons.push(`География: ${ctx.country}`);
    }

    if (applicantTypes.length === 0 || applicantTypes.some((t) => t.toUpperCase().includes(ctx.orgType.toUpperCase().slice(0, 3)))) {
      score += 10;
      reasons.push("Подходит тип организации");
    }

    if (row.deadline) {
      const days = (new Date(String(row.deadline)).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (days > 30) {
        score += 5;
        reasons.push("Дедлайн в будущем");
      }
    }

    return {
      grantId: String(row.id),
      title: String(row.title),
      titleRu: row.title_ru ? String(row.title_ru) : null,
      score: Math.min(score, 99),
      reason: reasons.join(" · ") || "Общее соответствие профилю",
      donorName: row.donor_name_ru ? String(row.donor_name_ru) : row.donor_name ? String(row.donor_name) : null,
      deadline: row.deadline ? new Date(String(row.deadline)).toISOString() : null,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
