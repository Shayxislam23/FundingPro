import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { validatePaymeBasicAuth, PaymeAuthError } from "../lib/payments/providers/payme/auth.ts";
import { paymeError, PAYME_ERRORS } from "../lib/payments/providers/payme/errors.ts";
import { buildPaymeCheckoutUrl } from "../lib/payments/providers/payme/checkout.ts";

function resolveOrderId(account) {
  if (!account || typeof account !== "object") return null;
  const orderId = account.order_id;
  if (orderId === undefined || orderId === null) return null;
  return String(orderId);
}

const ENV_KEYS = ["PAYME_MERCHANT_ID", "PAYME_MERCHANT_KEY", "PAYME_MERCHANT_LOGIN", "PAYME_TEST_MODE", "PAYME_CHECKOUT_BASE_URL"];
let savedEnv;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("Payme merchant helpers", () => {
  it("resolveOrderId reads order_id from account", () => {
    assert.equal(resolveOrderId({ order_id: "pay-abc" }), "pay-abc");
    assert.equal(resolveOrderId({}), null);
  });

  it("validatePaymeBasicAuth accepts the real Paycom:KEY login Payme's servers send", () => {
    process.env.PAYME_MERCHANT_KEY = "test_secret";
    delete process.env.PAYME_MERCHANT_LOGIN;
    const token = Buffer.from("Paycom:test_secret", "utf8").toString("base64");
    assert.doesNotThrow(() => validatePaymeBasicAuth(`Basic ${token}`));
  });

  it("validatePaymeBasicAuth rejects the old 'Payme' login — this is the exact bug fixed", () => {
    process.env.PAYME_MERCHANT_KEY = "test_secret";
    delete process.env.PAYME_MERCHANT_LOGIN;
    const staleToken = Buffer.from("Payme:test_secret", "utf8").toString("base64");
    assert.throws(() => validatePaymeBasicAuth(`Basic ${staleToken}`), PaymeAuthError);
  });

  it("validatePaymeBasicAuth respects PAYME_MERCHANT_LOGIN override", () => {
    process.env.PAYME_MERCHANT_KEY = "test_secret";
    process.env.PAYME_MERCHANT_LOGIN = "CustomLogin";
    const token = Buffer.from("CustomLogin:test_secret", "utf8").toString("base64");
    assert.doesNotThrow(() => validatePaymeBasicAuth(`Basic ${token}`));
  });

  it("validatePaymeBasicAuth rejects wrong credentials", () => {
    process.env.PAYME_MERCHANT_KEY = "test_secret";
    assert.throws(() => validatePaymeBasicAuth("Basic d3Jvbmc="), PaymeAuthError);
  });

  it("validatePaymeBasicAuth rejects when unconfigured", () => {
    delete process.env.PAYME_MERCHANT_KEY;
    assert.throws(() => validatePaymeBasicAuth("Basic d2hhdGV2ZXI="), PaymeAuthError);
  });

  it("buildPaymeCheckoutUrl encodes payload against the real checkout host", () => {
    process.env.PAYME_MERCHANT_ID = "merchant123";
    process.env.PAYME_TEST_MODE = "true";
    const url = buildPaymeCheckoutUrl("pay-1", 50000000);
    assert.ok(url?.startsWith("https://checkout.test.paycom.uz/"));
    assert.ok(url.length > 40);
  });

  it("buildPaymeCheckoutUrl returns null without a configured merchant id", () => {
    delete process.env.PAYME_MERCHANT_ID;
    assert.equal(buildPaymeCheckoutUrl("pay-1", 50000000), null);
  });

  it("paymeError returns the real official error codes", () => {
    assert.equal(paymeError("ORDER_NOT_FOUND").code, PAYME_ERRORS.ORDER_NOT_FOUND.code);
    assert.equal(paymeError("ORDER_NOT_FOUND").code, -31050);
    assert.equal(paymeError("INVALID_AMOUNT").code, -31001);
    assert.equal(paymeError("TRANSACTION_NOT_FOUND").code, -31003);
    assert.equal(paymeError("UNABLE_TO_CANCEL").code, -31007);
    assert.equal(paymeError("UNABLE_TO_PERFORM").code, -31008);
  });
});
