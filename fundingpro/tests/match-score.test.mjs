import { test } from "node:test";
import assert from "node:assert/strict";

const SECTOR_MAP = {
  education: ["education", "youth", "research"],
};

function normalizeSector(value) {
  const key = value.toLowerCase();
  for (const [profileKey, sectors] of Object.entries(SECTOR_MAP)) {
    if (key.includes(profileKey) || sectors.some((s) => key.includes(s))) return sectors;
  }
  return [key];
}

function scoreGrant(row, ctx) {
  let score = 40;
  const sectors = row.sectors ?? [];
  const countries = row.country_scope ?? [];
  if (ctx.sectorTerms.length > 0) {
    const sectorHit = ctx.sectorTerms.some((t) =>
      sectors.some((s) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase()))
    );
    if (sectorHit) score += 25;
  }
  if (countries.some((c) => c.toLowerCase().includes(ctx.country.toLowerCase()))) score += 20;
  return Math.min(score, 99);
}

test("sector match increases grant score", () => {
  const ctx = { sectorTerms: normalizeSector("education"), country: "Uzbekistan" };
  const matched = scoreGrant({ sectors: ["education"], country_scope: ["Uzbekistan"] }, ctx);
  const other = scoreGrant({ sectors: ["defense"], country_scope: ["Germany"] }, ctx);
  assert.ok(matched > other);
});
