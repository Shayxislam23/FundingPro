import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPartnerTimestampFresh,
  parsePartnerTimestamp,
  partnerSignedPayload,
  partnerUnsignedAllowed,
  verifyPartnerWebhookSignature,
} from "../lib/partners/partner-crypto.ts";
import crypto from "node:crypto";

describe("partner-crypto signing", () => {
  it("builds canonical signed payload", () => {
    assert.equal(partnerSignedPayload("1710000000", "nonce-1", "{\"a\":1}"), "1710000000.nonce-1.{\"a\":1}");
  });

  it("preserves raw millisecond timestamp strings in the signed payload", () => {
    const ms = "1710000000123";
    assert.equal(partnerSignedPayload(ms, "nonce-1", "{}"), `${ms}.nonce-1.{}`);
    assert.equal(parsePartnerTimestamp(ms), 1710000000);
  });

  it("verifies hmac and rejects tampering", () => {
    const secret = "test-secret";
    const payload = partnerSignedPayload("1710000000", "abc12345", "{}");
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    assert.equal(verifyPartnerWebhookSignature(payload, sig, secret), true);
    assert.equal(verifyPartnerWebhookSignature(payload + "x", sig, secret), false);
  });

  it("parses timestamp freshness", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.equal(parsePartnerTimestamp(String(now)), now);
    assert.equal(parsePartnerTimestamp(String(now * 1000)), now);
    assert.equal(isPartnerTimestampFresh(now, now, 300), true);
    assert.equal(isPartnerTimestampFresh(now - 400, now, 300), false);
  });

  it("blocks unsigned in production", () => {
    const prevNode = process.env.NODE_ENV;
    const prevAllow = process.env.PARTNER_AUTH_ALLOW_UNSIGNED;
    process.env.NODE_ENV = "production";
    process.env.PARTNER_AUTH_ALLOW_UNSIGNED = "true";
    assert.equal(partnerUnsignedAllowed(), false);
    process.env.NODE_ENV = "development";
    process.env.PARTNER_AUTH_ALLOW_UNSIGNED = "true";
    assert.equal(partnerUnsignedAllowed(), true);
    process.env.NODE_ENV = prevNode;
    if (prevAllow === undefined) delete process.env.PARTNER_AUTH_ALLOW_UNSIGNED;
    else process.env.PARTNER_AUTH_ALLOW_UNSIGNED = prevAllow;
  });
});
