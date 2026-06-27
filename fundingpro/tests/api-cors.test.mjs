import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAllowedOrigins, isOriginAllowed } from "../lib/api-cors.ts";

describe("api-cors", () => {
  it("parses comma-separated origins", () => {
    assert.deepEqual(parseAllowedOrigins("https://a.com, https://b.com"), [
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("allows listed origin", () => {
    const allowed = ["https://fundingpro.uz"];
    assert.equal(isOriginAllowed("https://fundingpro.uz", allowed), true);
    assert.equal(isOriginAllowed("https://evil.com", allowed), false);
  });

  it("wildcard allows any origin", () => {
    assert.equal(isOriginAllowed("https://any.example", ["*"]), true);
  });
});
