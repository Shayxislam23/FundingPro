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

function scoreGrants(
  rows: Record<string, unknown>[],
  ctx: { sectorTerms: string[]; country: string; orgType: string }
): { grantId: string; score: number }[] {
  const scored = rows.map((row) => {
    let score = 40;
    const sectors = (row.sectors as string[]) ?? [];
    const countries = (row.country_scope as string[]) ?? [];
    const applicantTypes = (row.applicant_types as string[]) ?? [];

    if (ctx.sectorTerms.length > 0) {
      const sectorHit = ctx.sectorTerms.some((t) =>
        sectors.some((s) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))
      );
      if (sectorHit) score += 25;
    }

    if (
      countries.some(
        (c) =>
          c.toLowerCase().includes(ctx.country.toLowerCase()) ||
          ctx.country.toLowerCase().includes(c.toLowerCase())
      )
    ) {
      score += 20;
    }

    if (
      applicantTypes.length === 0 ||
      applicantTypes.some((t) => t.toUpperCase().includes(ctx.orgType.toUpperCase().slice(0, 3)))
    ) {
      score += 10;
    }

    if (row.deadline) {
      const days = (new Date(String(row.deadline)).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (days > 30) score += 5;
    }

    return { grantId: String(row.id), score: Math.min(score, 99) };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export function buildMatchScoreMap(
  grants: {
    id: string;
    sectors?: string[];
    country_scope?: string[];
    applicant_types?: string[];
    deadline?: string | null;
  }[],
  profile: Record<string, unknown>
): Map<string, number> {
  const sectorRaw = String(profile.sector ?? profile.sectors ?? "");
  const countryRaw = String(profile.country ?? profile.country_scope ?? "Uzbekistan");
  const orgType = String(profile.org_type ?? profile.type ?? "NGO");
  const sectorTerms = sectorRaw ? normalizeSector(sectorRaw) : [];
  const country = countryRaw || "Uzbekistan";

  const rows = grants.map((g) => ({
    id: g.id,
    sectors: g.sectors ?? [],
    country_scope: g.country_scope ?? [],
    applicant_types: g.applicant_types ?? [],
    deadline: g.deadline ?? null,
  }));

  const scored = scoreGrants(rows, { sectorTerms, country, orgType });
  return new Map(scored.map((s) => [s.grantId, s.score]));
}
