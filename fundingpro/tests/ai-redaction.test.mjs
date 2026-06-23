import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PII_PATTERNS = [
  { name: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { name: "phone", pattern: /(\+?[\d\s\-().]{7,})/g },
  { name: "pinfl", pattern: /\b\d{14}\b/g },
];

function redactPii(text) {
  let result = text;
  const fieldsFound = [];
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(result)) {
      fieldsFound.push(name);
      result = result.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
    }
    pattern.lastIndex = 0;
  }
  return { redacted: result, fieldsFound };
}

describe("AI PII redaction", () => {
  it("redacts email addresses", () => {
    const { redacted, fieldsFound } = redactPii("Contact: user@example.com for details");
    assert.ok(!redacted.includes("user@example.com"));
    assert.ok(fieldsFound.includes("email"));
  });

  it("redacts long numeric identifiers", () => {
    const { redacted } = redactPii("PINFL: 12345678901234");
    assert.ok(!redacted.includes("12345678901234"));
    assert.match(redacted, /REDACTED_/);
  });

  it("leaves non-PII text unchanged", () => {
    const input = "НКО с опытом в экологии более 3 лет";
    const { redacted, fieldsFound } = redactPii(input);
    assert.equal(redacted, input);
    assert.equal(fieldsFound.length, 0);
  });
});
