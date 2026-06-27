import { createHash } from "crypto";
import {
  getClickTransaction,
  getPaymentByIdInternal,
  insertPaymentEvent,
  upsertClickTransaction,
} from "@/lib/db/payments";
import { activateSubscriptionFromPayment } from "../../activate-subscription";
import { getClickConfig } from "../../config";
import type { ClickShopRequest } from "../../types";

export type ClickShopResponse = {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id?: number;
  merchant_confirm_id?: number;
  error: number;
  error_note: string;
};

function clickError(code: number, note: string, partial: Partial<ClickShopResponse> = {}): ClickShopResponse {
  return {
    click_trans_id: Number(partial.click_trans_id ?? 0),
    merchant_trans_id: partial.merchant_trans_id ?? "",
    error: code,
    error_note: note,
    ...partial,
  };
}

function md5Sign(parts: (string | number)[]): string {
  return createHash("md5").update(parts.join(""), "utf8").digest("hex");
}

function verifyPrepareSign(body: ClickShopRequest, secretKey: string): boolean {
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

function verifyCompleteSign(body: ClickShopRequest, secretKey: string): boolean {
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

function expectedAmountTiyin(payment: { amountTiyin: number; metadata: Record<string, unknown> }): number {
  return payment.amountTiyin > 0 ? payment.amountTiyin : Number(payment.metadata.amountTiyin ?? 0);
}

export async function handleClickPrepare(body: ClickShopRequest): Promise<ClickShopResponse> {
  const { serviceId, secretKey } = getClickConfig();
  const clickTransId = String(body.click_trans_id);
  const merchantTransId = String(body.merchant_trans_id);
  const amount = Number(body.amount);
  const action = Number(body.action);

  if (String(body.service_id) !== serviceId) {
    return clickError(-5, "Service not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (action !== 0) {
    return clickError(-3, "Action not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (!verifyPrepareSign(body, secretKey)) {
    return clickError(-1, "Sign check failed", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const payment = await getPaymentByIdInternal(merchantTransId);
  if (!payment) {
    return clickError(-5, "User not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (payment.status === "SUCCESS") {
    return clickError(-4, "Already paid", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const expected = expectedAmountTiyin(payment);
  if (!expected || amount !== expected) {
    return clickError(-2, "Incorrect amount", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const existing = await getClickTransaction(clickTransId);
  if (existing?.merchantPrepareId) {
    return {
      click_trans_id: Number(body.click_trans_id),
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: Number(existing.merchantPrepareId),
      error: 0,
      error_note: "Success",
    };
  }

  const prepareId = String(Date.now());
  await upsertClickTransaction({
    clickTransId,
    paymentId: payment.id,
    state: "PREPARED",
    amountTiyin: amount,
    merchantPrepareId: prepareId,
  });
  await insertPaymentEvent(payment.id, "click_prepare", body as unknown as Record<string, unknown>, "click_shop");

  return {
    click_trans_id: Number(body.click_trans_id),
    merchant_trans_id: merchantTransId,
    merchant_prepare_id: Number(prepareId),
    error: 0,
    error_note: "Success",
  };
}

export async function handleClickComplete(body: ClickShopRequest): Promise<ClickShopResponse> {
  const { serviceId, secretKey } = getClickConfig();
  const clickTransId = String(body.click_trans_id);
  const merchantTransId = String(body.merchant_trans_id);
  const amount = Number(body.amount);
  const action = Number(body.action);
  const prepareId = String(body.merchant_prepare_id ?? "");

  if (String(body.service_id) !== serviceId) {
    return clickError(-5, "Service not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (action !== 1) {
    return clickError(-3, "Action not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (!verifyCompleteSign(body, secretKey)) {
    return clickError(-1, "Sign check failed", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const tx = await getClickTransaction(clickTransId);
  if (!tx || tx.merchantPrepareId !== prepareId) {
    return clickError(-6, "Transaction not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }
  if (tx.state === "COMPLETED") {
    return {
      click_trans_id: Number(body.click_trans_id),
      merchant_trans_id: merchantTransId,
      merchant_confirm_id: Number(tx.merchantConfirmId ?? prepareId),
      error: 0,
      error_note: "Success",
    };
  }

  const payment = await getPaymentByIdInternal(merchantTransId);
  if (!payment) {
    return clickError(-5, "User not found", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const expected = expectedAmountTiyin(payment);
  if (!expected || amount !== expected) {
    return clickError(-2, "Incorrect amount", { click_trans_id: Number(body.click_trans_id), merchant_trans_id: merchantTransId });
  }

  const confirmId = String(Date.now());
  await upsertClickTransaction({
    clickTransId,
    paymentId: payment.id,
    state: "COMPLETED",
    amountTiyin: amount,
    merchantPrepareId: tx.merchantPrepareId ?? prepareId,
    merchantConfirmId: confirmId,
  });
  await activateSubscriptionFromPayment(payment.id, "click_shop", body as unknown as Record<string, unknown>);
  await insertPaymentEvent(payment.id, "click_complete", body as unknown as Record<string, unknown>, "click_shop");

  return {
    click_trans_id: Number(body.click_trans_id),
    merchant_trans_id: merchantTransId,
    merchant_confirm_id: Number(confirmId),
    error: 0,
    error_note: "Success",
  };
}

export function buildClickPayUrl(paymentId: string, amountTiyin: number): string | null {
  const { merchantId, serviceId } = getClickConfig();
  if (!merchantId || !serviceId) return null;
  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amountTiyin),
    transaction_param: paymentId,
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}
