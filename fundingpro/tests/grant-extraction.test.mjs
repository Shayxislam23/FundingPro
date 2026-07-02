import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseExtractedGrant } from "../lib/grant-extraction.ts";

const validPayload = {
  title: "Climate Resilience Programme",
  titleRu: "Программа климатической устойчивости",
  description: "Support for climate adaptation projects.",
  descriptionRu: "Поддержка проектов адаптации к климату.",
  donorName: "UNDP",
  sectors: ["Climate", "environment"],
  countryScope: ["Uzbekistan"],
  applicantTypes: ["NGO", "Alien", "Government"],
  amountMin: 50000,
  amountMax: 250000,
  currency: "usd",
  deadline: "2026-12-31",
  sourceUrl: "https://www.undp.org/uzbekistan",
  requirements: ["Registered NGO", "2+ years of operations"],
};

describe("parseExtractedGrant", () => {
  it("parses and normalizes a valid AI response", () => {
    const result = parseExtractedGrant(JSON.stringify(validPayload));
    assert.equal(result.ok, true);
    const draft = result.draft;
    assert.equal(draft.title, "Climate Resilience Programme");
    assert.deepEqual(draft.sectors, ["climate", "environment"]);
    // unknown applicant types are dropped, known ones kept
    assert.deepEqual(draft.applicantTypes, ["NGO", "Government"]);
    assert.equal(draft.currency, "USD");
    assert.equal(draft.deadline, "2026-12-31");
    assert.equal(draft.sourceUrl, "https://www.undp.org/uzbekistan");
    assert.equal(draft.requirements.length, 2);
  });

  it("strips markdown code fences around JSON", () => {
    const fenced = "```json\n" + JSON.stringify(validPayload) + "\n```";
    const result = parseExtractedGrant(fenced);
    assert.equal(result.ok, true);
  });

  it("rejects non-JSON and non-object payloads", () => {
    assert.equal(parseExtractedGrant("plain text answer").ok, false);
    assert.equal(parseExtractedGrant("[1,2,3]").ok, false);
  });

  it("rejects payloads without a title", () => {
    const result = parseExtractedGrant(JSON.stringify({ ...validPayload, title: "  " }));
    assert.equal(result.ok, false);
    assert.equal(result.error, "missing_title");
  });

  it("nulls suspicious values instead of failing", () => {
    const result = parseExtractedGrant(
      JSON.stringify({
        title: "Grant",
        deadline: "end of the year",
        sourceUrl: "javascript:alert(1)",
        amountMin: -5,
        amountMax: "not a number",
        currency: "sums",
      })
    );
    assert.equal(result.ok, true);
    assert.equal(result.draft.deadline, null);
    assert.equal(result.draft.sourceUrl, null);
    assert.equal(result.draft.amountMin, null);
    assert.equal(result.draft.amountMax, null);
    assert.equal(result.draft.currency, "USD");
  });

  it("drops amountMax below amountMin", () => {
    const result = parseExtractedGrant(
      JSON.stringify({ title: "Grant", amountMin: 100000, amountMax: 500 })
    );
    assert.equal(result.ok, true);
    assert.equal(result.draft.amountMin, 100000);
    assert.equal(result.draft.amountMax, null);
  });
});
