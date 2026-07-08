import { describe, it } from "node:test";
import assert from "node:assert/strict";

function computeEligibility(answers) {
  let score = 50;
  const applicantType = String(answers.applicant_type ?? "");
  if (applicantType === "Да") score += 10;

  const experience = String(answers.experience ?? "");
  if (experience.includes("3 лет")) score += 20;
  else if (experience.includes("Нет")) score -= 10;

  const documents = String(answers.documents ?? "");
  if (documents.includes("Все готовы")) score += 15;
  else if (documents.includes("Нет")) score -= 20;

  const education = String(answers.education ?? "");
  if (education.includes("Бакалавр")) score += 8;

  const clamped = Math.max(0, Math.min(100, score));
  const status = clamped >= 70 ? "ELIGIBLE" : clamped >= 40 ? "PARTIALLY_ELIGIBLE" : "NOT_ELIGIBLE";
  return { score: clamped, status };
}

describe("eligibility scoring", () => {
  it("individual with experience and documents scores eligible", () => {
    const r = computeEligibility({
      applicant_type: "Да",
      experience: "Более 3 лет",
      documents: "Все готовы",
      education: "Бакалавр",
    });
    assert.ok(r.score >= 70);
    assert.equal(r.status, "ELIGIBLE");
  });

  it("individual with no experience and no documents scores low", () => {
    const r = computeEligibility({
      applicant_type: "Да",
      experience: "Нет опыта",
      documents: "Нет документов",
      education: "Школа",
    });
    assert.ok(r.score < 40);
    assert.equal(r.status, "NOT_ELIGIBLE");
  });
});
