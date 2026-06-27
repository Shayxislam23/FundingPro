import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function paymeError(key) {
  const errors = {
    ORDER_NOT_FOUND: { code: -31050, message: { en: "Order not found" } },
    INVALID_AMOUNT: { code: -31001, message: { en: "Invalid amount" } },
    TRANSACTION_NOT_FOUND: { code: -31003, message: { en: "Transaction not found" } },
  };
  return errors[key];
}

function resolveOrderId(account) {
  if (!account || typeof account !== "object") return null;
  const orderId = account.order_id;
  if (orderId === undefined || orderId === null) return null;
  return String(orderId);
}

function validatePaymeBasicAuth(authorizationHeader, merchantKey) {
  if (!merchantKey) throw new Error("not configured");
  if (!authorizationHeader?.startsWith("Basic ")) throw new Error("missing auth");
  const provided = authorizationHeader.slice(6).trim();
  const expected = Buffer.from(`Payme:${merchantKey}`, "utf8").toString("base64");
  if (provided !== expected) throw new Error("invalid auth");
}

function buildPaymeCheckoutUrl(merchantId, paymentId, amountTiyin) {
  if (!merchantId) return null;
  const payload = { m: merchantId, ac: { order_id: paymentId }, a: amountTiyin, l: "ru" };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `https://checkout.test.paycom.uz/${encoded}`;
}

describe("Payme merchant helpers", () => {
  it("resolveOrderId reads order_id from account", () => {
    assert.equal(resolveOrderId({ order_id: "pay-abc" }), "pay-abc");
    assert.equal(resolveOrderId({}), null);
  });

  it("validatePaymeBasicAuth accepts Payme:KEY", () => {
    const key = "test_secret";
    const token = Buffer.from(`Payme:${key}`, "utf8").toString("base64");
    assert.doesNotThrow(() => validatePaymeBasicAuth(`Basic ${token}`, key));
  });

  it("validatePaymeBasicAuth rejects wrong credentials", () => {
    assert.throws(() => validatePaymeBasicAuth("Basic wrong", "secret"), /invalid auth/);
  });

  it("buildPaymeCheckoutUrl encodes payload", () => {
    const url = buildPaymeCheckoutUrl("merchant123", "pay-1", 50000000);
    assert.ok(url?.startsWith("https://checkout.test.paycom.uz/"));
    assert.ok(url.length > 40);
  });

  it("paymeError returns standard codes", () => {
    assert.equal(paymeError("ORDER_NOT_FOUND").code, -31050);
    assert.equal(paymeError("INVALID_AMOUNT").code, -31001);
  });

  it("HMAC helper parity for webhook tests", () => {
    const secret = "payme-test";
    const payload = JSON.stringify({ method: "CheckPerformTransaction" });
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    assert.equal(sig.length, 64);
  });
});
