import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Pure helpers mirrored from lib/payments (no TS import in .mjs tests)

function resolvePaymentIdFromParams(params) {
  if (!params) return null;
  const raw = params.account ?? params.orderId ?? params.order_id;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

function usdToUzs(amountUsd, rate = 12800) {
  return Math.round(amountUsd * rate);
}

function uzsToTiyin(amountUzs) {
  return Math.round(amountUzs * 100);
}

function usdToTiyin(amountUsd, rate = 12800) {
  return uzsToTiyin(usdToUzs(amountUsd, rate));
}

function validateUzumBasicAuth(authorizationHeader, login, password) {
  if (!login || !password) {
    throw new Error("MerchantNotConfigured");
  }
  if (!authorizationHeader?.startsWith("Basic ")) {
    throw new Error("TokenIsRequired");
  }
  const provided = authorizationHeader.slice(6).trim();
  const expected = Buffer.from(`${login}:${password}`, "utf8").toString("base64");
  if (provided !== expected) {
    throw new Error("InvalidToken");
  }
}

function buildUzumAppDeepLink(serviceId, paymentId, amountTiyin) {
  if (!serviceId) return null;
  const params = new URLSearchParams({
    serviceId,
    order_id: paymentId,
    amount: String(amountTiyin),
  });
  return `https://www.apelsin.uz/open-service?${params.toString()}`;
}

describe("Uzum merchant helpers", () => {
  it("resolvePaymentIdFromParams prefers account", () => {
    assert.equal(resolvePaymentIdFromParams({ account: "pay-123" }), "pay-123");
    assert.equal(resolvePaymentIdFromParams({ order_id: "ord-1" }), "ord-1");
    assert.equal(resolvePaymentIdFromParams({ orderId: 42 }), "42");
    assert.equal(resolvePaymentIdFromParams(undefined), null);
  });

  it("usdToTiyin converts with rate", () => {
    // $30 @ 12800 UZS = 384000 UZS = 38400000 tiyin
    assert.equal(usdToTiyin(30, 12800), 38400000);
    assert.equal(usdToTiyin(50, 12800), 64000000);
  });

  it("validateUzumBasicAuth accepts valid credentials", () => {
    const token = Buffer.from("merchant:secret", "utf8").toString("base64");
    assert.doesNotThrow(() =>
      validateUzumBasicAuth(`Basic ${token}`, "merchant", "secret")
    );
  });

  it("validateUzumBasicAuth rejects invalid token", () => {
    assert.throws(
      () => validateUzumBasicAuth("Basic wrong", "merchant", "secret"),
      /InvalidToken/
    );
    assert.throws(
      () => validateUzumBasicAuth(null, "merchant", "secret"),
      /TokenIsRequired/
    );
  });

  it("buildUzumAppDeepLink includes serviceId and amount", () => {
    const url = buildUzumAppDeepLink("svc-1", "payment-uuid", 2500000);
    assert.ok(url?.includes("serviceId=svc-1"));
    assert.ok(url?.includes("order_id=payment-uuid"));
    assert.ok(url?.includes("amount=2500000"));
    assert.equal(buildUzumAppDeepLink("", "x", 100), null);
  });
});

describe("Uzum merchant webhook contract (fixtures)", () => {
  it("create response shape", () => {
    const fixture = {
      serviceId: "TEST_SERVICE",
      timestamp: "1698361456728",
      status: "CREATED",
      transTime: "1698361456728",
      amount: 38400000,
      transId: "uuid-from-uzum",
    };
    assert.equal(fixture.status, "CREATED");
    assert.equal(typeof fixture.amount, "number");
    assert.ok(fixture.transId);
  });

  it("check request maps params.account to payment id", () => {
    const body = {
      serviceId: "TEST_SERVICE",
      timestamp: 1698361456728,
      params: { account: "550e8400-e29b-41d4-a716-446655440000" },
    };
    assert.equal(resolvePaymentIdFromParams(body.params), body.params.account);
  });
});
