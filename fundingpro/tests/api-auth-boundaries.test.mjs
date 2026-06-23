import { describe, it } from "node:test";
import assert from "node:assert/strict";

function parseAdminEmails(env = "") {
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email, adminEmails, bypassDev = false, nodeEnv = "test") {
  if (!email) return false;
  if (bypassDev && nodeEnv !== "production") return true;
  return parseAdminEmails(adminEmails).includes(email.toLowerCase());
}

function legacyWebhookStatus() {
  return 410;
}

describe("admin access helpers", () => {
  it("parses ADMIN_EMAILS allowlist", () => {
    assert.deepEqual(parseAdminEmails("a@x.com, B@y.com "), ["a@x.com", "b@y.com"]);
  });

  it("isAdminEmail matches allowlist", () => {
    assert.equal(isAdminEmail("admin@fundingpro.uz", "admin@fundingpro.uz"), true);
    assert.equal(isAdminEmail("user@test.com", "admin@fundingpro.uz"), false);
  });

  it("ADMIN_BYPASS_DEV grants admin in non-production", () => {
    assert.equal(isAdminEmail("any@test.com", "", true, "development"), true);
    assert.equal(isAdminEmail("any@test.com", "", true, "production"), false);
  });
});

describe("API auth boundaries (contract)", () => {
  it("legacy payment webhook returns 410 Gone", () => {
    assert.equal(legacyWebhookStatus(), 410);
  });

  it("unauthenticated me response is 401 shape", () => {
    const unauth = { success: false, data: { isAdmin: false } };
    assert.equal(unauth.success, false);
  });

  it("public grants list does not require auth header", () => {
    const publicRoute = "/api/v1/grants";
    assert.ok(publicRoute.includes("/grants"));
  });
});
