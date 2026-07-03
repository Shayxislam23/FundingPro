import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { getClientIp } from "../lib/api-rate-limit.ts";

function requestWithHeaders(headers) {
  return new NextRequest("https://example.com/api/v1/health", { headers });
}

describe("getClientIp", () => {
  it("returns the leftmost valid IPv4 from x-forwarded-for", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
    assert.equal(getClientIp(req), "203.0.113.5");
  });

  it("accepts IPv6 addresses", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "2001:db8::1" });
    assert.equal(getClientIp(req), "2001:db8::1");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = requestWithHeaders({ "x-real-ip": "198.51.100.7" });
    assert.equal(getClientIp(req), "198.51.100.7");
  });

  it("rejects a forged non-IP x-forwarded-for value instead of using it as a bucket key", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "'; DROP TABLE users; --" });
    assert.equal(getClientIp(req), "unknown");
  });

  it("rejects an oversized x-forwarded-for value", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "1".repeat(500) });
    assert.equal(getClientIp(req), "unknown");
  });

  it("falls back to x-real-ip when the forwarded value is malformed", () => {
    const req = requestWithHeaders({
      "x-forwarded-for": "not-an-ip",
      "x-real-ip": "192.0.2.44",
    });
    assert.equal(getClientIp(req), "192.0.2.44");
  });

  it("returns 'unknown' when no usable header is present", () => {
    const req = requestWithHeaders({});
    assert.equal(getClientIp(req), "unknown");
  });
});
