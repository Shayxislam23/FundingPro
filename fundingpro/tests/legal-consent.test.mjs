import { test } from "node:test";
import assert from "node:assert/strict";

const LEGAL_EFFECTIVE_DATE = "2026-06-01";

const LEGAL_DOCUMENTS = [
  { id: "offer", version: LEGAL_EFFECTIVE_DATE, consentType: "terms", required: true },
  { id: "privacy", version: LEGAL_EFFECTIVE_DATE, consentType: "privacy", required: true },
  { id: "refunds", version: LEGAL_EFFECTIVE_DATE, consentType: "payment_terms", required: false },
  { id: "ai", version: LEGAL_EFFECTIVE_DATE, consentType: "ai_processing", required: false },
  { id: "success-fee", version: LEGAL_EFFECTIVE_DATE, consentType: null, required: false },
];

const REQUIRED_CONSENTS = ["terms", "privacy"];

function getConsentVersion(consentType) {
  const doc = LEGAL_DOCUMENTS.find((d) => d.consentType === consentType);
  return doc?.version ?? LEGAL_EFFECTIVE_DATE;
}

function hasCurrentConsents(records) {
  const latestByType = new Map();
  for (const r of records) {
    if (!latestByType.has(r.consentType)) {
      latestByType.set(r.consentType, r.documentVersion);
    }
  }
  const missing = [];
  for (const type of REQUIRED_CONSENTS) {
    const current = getConsentVersion(type);
    const accepted = latestByType.get(type);
    if (!accepted || accepted !== current) missing.push(type);
  }
  return { ok: missing.length === 0, missing, needsReconsent: missing.length > 0 };
}

test("legal manifest has required documents with versions", () => {
  const required = LEGAL_DOCUMENTS.filter((d) => d.required);
  assert.equal(required.length, 2);
  assert.ok(required.some((d) => d.consentType === "terms"));
  assert.ok(required.some((d) => d.consentType === "privacy"));
  for (const doc of LEGAL_DOCUMENTS) {
    assert.match(doc.version, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("consent version map", () => {
  assert.equal(getConsentVersion("terms"), LEGAL_EFFECTIVE_DATE);
  assert.equal(getConsentVersion("privacy"), LEGAL_EFFECTIVE_DATE);
  assert.equal(getConsentVersion("payment_terms"), LEGAL_EFFECTIVE_DATE);
  assert.equal(getConsentVersion("ai_processing"), LEGAL_EFFECTIVE_DATE);
});

test("user with current terms and privacy passes", () => {
  const status = hasCurrentConsents([
    { consentType: "terms", documentVersion: LEGAL_EFFECTIVE_DATE },
    { consentType: "privacy", documentVersion: LEGAL_EFFECTIVE_DATE },
  ]);
  assert.equal(status.ok, true);
  assert.equal(status.needsReconsent, false);
});

test("missing privacy triggers reconsent", () => {
  const status = hasCurrentConsents([
    { consentType: "terms", documentVersion: LEGAL_EFFECTIVE_DATE },
  ]);
  assert.equal(status.ok, false);
  assert.deepEqual(status.missing, ["privacy"]);
  assert.equal(status.needsReconsent, true);
});

test("outdated version triggers reconsent", () => {
  const status = hasCurrentConsents([
    { consentType: "terms", documentVersion: "2025-01-01" },
    { consentType: "privacy", documentVersion: LEGAL_EFFECTIVE_DATE },
  ]);
  assert.equal(status.ok, false);
  assert.deepEqual(status.missing, ["terms"]);
});

test("payment_terms alone does not affect reconsent banner", () => {
  const status = hasCurrentConsents([
    { consentType: "terms", documentVersion: LEGAL_EFFECTIVE_DATE },
    { consentType: "privacy", documentVersion: LEGAL_EFFECTIVE_DATE },
    { consentType: "payment_terms", documentVersion: "2025-01-01" },
  ]);
  assert.equal(status.ok, true);
  assert.equal(status.needsReconsent, false);
});
