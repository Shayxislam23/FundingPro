import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function md5Sign(parts) {
  return crypto.createHash("md5").update(parts.join(""), "utf8").digest("hex");
}

function verifyPrepareSign(body, secretKey) {
  const expected = md5Sign([
    body.click_trans_id,
    body.service_id,
    secretKey,
    body.merchant_trans_id,
    body.amount,
    body.action,
    body.sign_time,
  ]);
  return expected === body.sign_string;
}

function verifyCompleteSign(body, secretKey) {
  const expected = md5Sign([
    body.click_trans_id,
    body.service_id,
    secretKey,
    body.merchant_trans_id,
    body.merchant_prepare_id ?? "",
    body.amount,
    body.action,
    body.sign_time,
  ]);
  return expected === body.sign_string;
}

function buildClickPayUrl(merchantId, serviceId, paymentId, amountTiyin) {
  if (!merchantId || !serviceId) return null;
  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amountTiyin),
    transaction_param: paymentId,
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

describe("Click SHOP helpers", () => {
  const secret = "click_secret_key";
  const base = {
    click_trans_id: 1001,
    service_id: "svc-1",
    merchant_trans_id: "pay-123",
    amount: 50000000,
    sign_time: "2026-06-27 12:00:00",
  };

  it("verifyPrepareSign validates MD5 signature", () => {
    const action = 0;
    const sign_string = md5Sign([
      base.click_trans_id,
      base.service_id,
      secret,
      base.merchant_trans_id,
      base.amount,
      action,
      base.sign_time,
    ]);
    const body = { ...base, action, sign_string };
    assert.equal(verifyPrepareSign(body, secret), true);
    assert.equal(verifyPrepareSign({ ...body, sign_string: "bad" }, secret), false);
  });

  it("verifyCompleteSign includes merchant_prepare_id", () => {
    const action = 1;
    const merchant_prepare_id = "1719494400000";
    const sign_string = md5Sign([
      base.click_trans_id,
      base.service_id,
      secret,
      base.merchant_trans_id,
      merchant_prepare_id,
      base.amount,
      action,
      base.sign_time,
    ]);
    const body = { ...base, action, merchant_prepare_id, sign_string };
    assert.equal(verifyCompleteSign(body, secret), true);
  });

  it("buildClickPayUrl includes transaction_param", () => {
    const url = buildClickPayUrl("m1", "s1", "pay-abc", 38400000);
    assert.ok(url?.includes("my.click.uz"));
    assert.ok(url?.includes("transaction_param=pay-abc"));
    assert.ok(url?.includes("amount=38400000"));
  });
});
