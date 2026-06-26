import { describe, it } from "node:test";
import assert from "node:assert/strict";

const MOBILE_CHECKOUT_RETURN = "fundingpro://subscription/return";
const ALLOWED_WEB_HOSTS = new Set(["fundingpro.uz", "www.fundingpro.uz", "localhost", "127.0.0.1"]);

function isAllowedCheckoutReturnUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "fundingpro:") {
      return parsed.hostname === "subscription" && parsed.pathname === "/return";
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_WEB_HOSTS.has(host)) return false;
    return parsed.pathname.startsWith("/dashboard/subscription");
  } catch {
    return false;
  }
}

function resolveCheckoutReturnUrl(platform) {
  if (platform === "mobile") return MOBILE_CHECKOUT_RETURN;
  return "http://localhost:3000/dashboard/subscription/return";
}

describe("payment return URL security", () => {
  it("mobile always uses fixed deeplink", () => {
    assert.equal(resolveCheckoutReturnUrl("mobile"), MOBILE_CHECKOUT_RETURN);
  });

  it("allows fundingpro mobile scheme", () => {
    assert.equal(isAllowedCheckoutReturnUrl("fundingpro://subscription/return"), true);
  });

  it("rejects external phishing domain", () => {
    assert.equal(isAllowedCheckoutReturnUrl("https://evil.example/fake"), false);
  });

  it("rejects javascript URLs", () => {
    assert.equal(isAllowedCheckoutReturnUrl("javascript:alert(1)"), false);
  });
});
