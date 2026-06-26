import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirrors mobile/lib/auth/callback-validation.ts
const AUTH_CALLBACK_PATH = /^fundingpro:\/\/auth\/callback\/?$/i;
const JWT_PART = /^[A-Za-z0-9_-]+$/;
const TOKEN_HASH = /^[A-Za-z0-9_-]{16,256}$/;
const OTP_TYPES = new Set(["recovery", "email", "signup", "invite", "magiclink", "email_change"]);

function isValidAuthCallbackUrl(url) {
  try {
    const base = url.split("#")[0]?.split("?")[0] ?? "";
    return AUTH_CALLBACK_PATH.test(base);
  } catch {
    return false;
  }
}

function isPlausibleJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  return parts.every((part) => part.length > 0 && part.length < 4096 && JWT_PART.test(part));
}

function parseAuthCallbackUrl(url) {
  if (!isValidAuthCallbackUrl(url)) return null;

  const hash = url.split("#")[1];
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token && isPlausibleJwt(access_token) && isPlausibleJwt(refresh_token)) {
      return { kind: "session", access_token, refresh_token };
    }
  }

  const query = url.includes("?") ? url.split("?")[1]?.split("#")[0] : undefined;
  if (query) {
    const params = new URLSearchParams(query);
    const token_hash = params.get("token_hash") ?? "";
    const type = params.get("type") ?? "recovery";
    if (TOKEN_HASH.test(token_hash) && OTP_TYPES.has(type)) {
      return { kind: "otp", token_hash, type };
    }
  }

  return null;
}

const sampleJwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";

describe("auth callback deep link validation", () => {
  it("accepts valid session callback", () => {
    const url = `fundingpro://auth/callback#access_token=${sampleJwt}&refresh_token=${sampleJwt}`;
    const payload = parseAuthCallbackUrl(url);
    assert.equal(payload?.kind, "session");
  });

  it("rejects wrong scheme/path", () => {
    assert.equal(parseAuthCallbackUrl("https://evil.example/auth/callback"), null);
    assert.equal(parseAuthCallbackUrl("fundingpro://subscription/return"), null);
  });

  it("rejects malformed JWT tokens", () => {
    const url = "fundingpro://auth/callback#access_token=not-a-jwt&refresh_token=also-bad";
    assert.equal(parseAuthCallbackUrl(url), null);
  });

  it("accepts OTP token_hash query flow", () => {
    const url = "fundingpro://auth/callback?token_hash=abcdefghijklmnopqrst&type=recovery";
    const payload = parseAuthCallbackUrl(url);
    assert.equal(payload?.kind, "otp");
  });
});
