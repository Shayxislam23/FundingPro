import { describe, it } from "node:test";
import assert from "node:assert/strict";

function isPaymentsEnabled() {
  return process.env.PAYMENTS_ENABLED === "true";
}

function getPaymentIntegrationStatus() {
  if (!isPaymentsEnabled()) {
    return process.env.PAYMENT_INTEGRATION_STATUS ?? "pending_integration";
  }
  const merchantOk =
    process.env.UZUM_MERCHANT_SERVICE_ID &&
    process.env.UZUM_MERCHANT_LOGIN &&
    process.env.UZUM_MERCHANT_PASSWORD;
  const checkoutOk =
    process.env.UZUM_CHECKOUT_TERMINAL_ID && process.env.UZUM_CHECKOUT_SECRET;
  if (!merchantOk && !checkoutOk) return "configured_partial";
  return "active";
}

function createPaymentRequest() {
  if (!isPaymentsEnabled()) {
    return {
      status: "pending_integration",
      message:
        "Payment integration is not enabled yet. The user can submit a subscription request.",
    };
  }
  return {
    status: "ready",
    message: "Online payment is available via Uzum Bank.",
  };
}

describe("payments config", () => {
  it("payments disabled by default", () => {
    const prev = process.env.PAYMENTS_ENABLED;
    delete process.env.PAYMENTS_ENABLED;
    assert.equal(isPaymentsEnabled(), false);
    process.env.PAYMENTS_ENABLED = prev;
  });

  it("createPaymentRequest returns pending_integration when disabled", () => {
    const prev = process.env.PAYMENTS_ENABLED;
    process.env.PAYMENTS_ENABLED = "false";
    const r = createPaymentRequest();
    assert.equal(r.status, "pending_integration");
    assert.match(r.message, /not enabled/i);
    process.env.PAYMENTS_ENABLED = prev;
  });

  it("createPaymentRequest returns ready when enabled", () => {
    const prev = process.env.PAYMENTS_ENABLED;
    process.env.PAYMENTS_ENABLED = "true";
    const r = createPaymentRequest();
    assert.equal(r.status, "ready");
    assert.match(r.message, /Uzum/i);
    process.env.PAYMENTS_ENABLED = prev;
  });

  it("integration status is pending when payments off", () => {
    const prevPay = process.env.PAYMENTS_ENABLED;
    const prevStat = process.env.PAYMENT_INTEGRATION_STATUS;
    process.env.PAYMENTS_ENABLED = "false";
    process.env.PAYMENT_INTEGRATION_STATUS = "pending_integration";
    assert.equal(getPaymentIntegrationStatus(), "pending_integration");
    process.env.PAYMENTS_ENABLED = prevPay;
    process.env.PAYMENT_INTEGRATION_STATUS = prevStat;
  });
});
