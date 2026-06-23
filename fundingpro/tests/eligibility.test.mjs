import { describe, it } from "node:test";
import assert from "node:assert/strict";

function computeEligibility(answers) {
  let score = 50;
  const orgType = String(answers.org_type ?? "");
  if (orgType.includes("НКО")) score += 15;
  else if (orgType.includes("физлицо")) score -= 15;

  const experience = String(answers.experience ?? "");
  if (experience.includes("3 лет")) score += 20;
  else if (experience.includes("Нет")) score -= 15;

  const documents = String(answers.documents ?? "");
  if (documents.includes("готовы")) score += 10;
  else if (documents.includes("Нет")) score -= 20;

  const clamped = Math.max(0, Math.min(100, score));
  const status = clamped >= 70 ? "ELIGIBLE" : clamped >= 40 ? "PARTIALLY_ELIGIBLE" : "NOT_ELIGIBLE";
  return { score: clamped, status };
}

describe("eligibility scoring", () => {
  it("NGO with experience scores eligible", () => {
    const r = computeEligibility({
      org_type: "НКО",
      experience: "Более 3 лет",
      documents: "Все готовы",
    });
    assert.ok(r.score >= 70);
    assert.equal(r.status, "ELIGIBLE");
  });

  it("individual with no experience scores low", () => {
    const r = computeEligibility({
      org_type: "физлицо",
      experience: "Нет",
      documents: "Нет",
    });
    assert.ok(r.score <= 20);
    assert.equal(r.status, "NOT_ELIGIBLE");
  });
});
