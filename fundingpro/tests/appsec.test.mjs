import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PROPOSAL_SECTION_KEYS = [
  "summary",
  "problem",
  "goal",
  "activities",
  "results",
  "budget",
  "logframe",
  "risks",
  "sustainability",
];

const SECTION_KEY_SET = new Set(PROPOSAL_SECTION_KEYS);

function filterProposalSections(sections, maxSections = 5) {
  if (!Array.isArray(sections)) return [];
  const unique = [];
  for (const raw of sections) {
    if (typeof raw !== "string") continue;
    const key = raw.trim().toLowerCase();
    if (!SECTION_KEY_SET.has(key)) continue;
    if (unique.includes(key)) continue;
    unique.push(key);
    if (unique.length >= maxSections) break;
  }
  return unique;
}

function detectMimeFromBytes(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  return null;
}

function validateFileContent(declaredMime, buffer) {
  const sniffed = detectMimeFromBytes(buffer);
  if (sniffed && sniffed !== declaredMime) {
    return "File content does not match declared type";
  }
  return null;
}

describe("filterProposalSections", () => {
  it("allows known keys only", () => {
    const result = filterProposalSections(["summary", "problem", "invalid", "goal"]);
    assert.deepEqual(result, ["summary", "problem", "goal"]);
  });

  it("rejects injection-like section names", () => {
    const result = filterProposalSections(["'; DROP TABLE users;--", "summary"]);
    assert.deepEqual(result, ["summary"]);
  });

  it("caps at max sections", () => {
    const result = filterProposalSections(PROPOSAL_SECTION_KEYS, 3);
    assert.equal(result.length, 3);
  });
});

describe("file sniff", () => {
  it("detects PDF magic bytes", () => {
    const buf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer;
    assert.equal(detectMimeFromBytes(buf), "application/pdf");
  });

  it("rejects MIME mismatch", () => {
    const buf = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
    assert.equal(validateFileContent("image/png", buf), "File content does not match declared type");
  });
});
