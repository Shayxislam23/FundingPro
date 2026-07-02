import { test } from "node:test";
import assert from "node:assert/strict";

// Import the real module (tsx loader) so the tests cover production scoring,
// not a copy that can silently drift from lib/match-score.ts.
import { buildMatchScoreMap } from "../lib/match-score.ts";

const profile = { sector: "education", country: "Uzbekistan", org_type: "NGO" };

const farDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

test("fully matching grant scores high", () => {
  const scores = buildMatchScoreMap(
    [
      {
        id: "match",
        sectors: ["education"],
        country_scope: ["Uzbekistan"],
        applicant_types: ["NGO"],
        deadline: farDeadline,
      },
    ],
    profile
  );
  assert.ok(scores.get("match") >= 85, `expected >= 85, got ${scores.get("match")}`);
});

test("irrelevant grant scores low instead of inflated baseline", () => {
  const scores = buildMatchScoreMap(
    [
      {
        id: "irrelevant",
        sectors: ["defense"],
        country_scope: ["Germany"],
        applicant_types: ["Government"],
        deadline: null,
      },
    ],
    profile
  );
  assert.ok(scores.get("irrelevant") < 20, `expected < 20, got ${scores.get("irrelevant")}`);
});

test("sector match ranks above country-only match", () => {
  const scores = buildMatchScoreMap(
    [
      {
        id: "sector-hit",
        sectors: ["education"],
        country_scope: ["Germany"],
        applicant_types: [],
        deadline: null,
      },
      {
        id: "country-only",
        sectors: ["defense"],
        country_scope: ["Uzbekistan"],
        applicant_types: [],
        deadline: null,
      },
    ],
    profile
  );
  assert.ok(scores.get("sector-hit") > scores.get("country-only"));
});
