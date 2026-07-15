import {
  getPaymentByIdInternal,
  getPaymeTransaction,
  insertPaymentEvent,
  upsertPaymeTransaction,
} from "@/lib/db/payments";
import { activateSubscriptionFromPayment, reverseSubscriptionFromPayment } from "../../activate-subscription";
import { PAYME_STATE, paymeError, type PaymeRpcFailure, type PaymeRpcRequest, type PaymeRpcSuccess } from "./errors";

/** Payme spec: a PENDING transaction not performed within 12h must be treated as expired (state -1, reason 4). */
const PENDING_TIMEOUT_MS = 43_200_000;
const CANCEL_REASON_TIMEOUT = 4;

type PaymeTransactionRow = NonNullable<Awaited<ReturnType<typeof getPaymeTransaction>>>;

/** Auto-cancels a PENDING transaction that has sat past the 12h window before it's read or acted on. */
async function expireIfTimedOut(tx: PaymeTransactionRow): Promise<PaymeTransactionRow> {
  if (tx.state !== PAYME_STATE.PENDING || !tx.createTime) return tx;
  if (Date.now() - tx.createTime < PENDING_TIMEOUT_MS) return tx;

  const cancelTime = Date.now();
  await upsertPaymeTransaction({
    paymeTransId: tx.paymeTransId,
    paymentId: tx.paymentId,
    state: PAYME_STATE.PENDING_CANCELLED,
    amountTiyin: tx.amountTiyin,
    createTime: tx.createTime,
    cancelTime,
    cancelReason: CANCEL_REASON_TIMEOUT,
  });
  return { ...tx, state: PAYME_STATE.PENDING_CANCELLED, cancelTime, cancelReason: CANCEL_REASON_TIMEOUT };
}

function resolveOrderId(account: unknown): string | null {
  if (!account || typeof account !== "object") return null;
  const orderId = (account as { order_id?: unknown }).order_id;
  if (orderId === undefined || orderId === null) return null;
  return String(orderId);
}

async function loadPayment(orderId: string) {
  const payment = await getPaymentByIdInternal(orderId);
  if (!payment) return null;
  return payment;
}

function expectedAmountTiyin(payment: { amountTiyin: number; metadata: Record<string, unknown> }): number {
  return payment.amountTiyin > 0 ? payment.amountTiyin : Number(payment.metadata.amountTiyin ?? 0);
}

function rpcSuccess(id: PaymeRpcRequest["id"], result: Record<string, unknown>): PaymeRpcSuccess {
  return { result, id };
}

function rpcFailure(id: PaymeRpcRequest["id"] | null, key: Parameters<typeof paymeError>[0], data?: string): PaymeRpcFailure {
  return { error: paymeError(key, data ?? null), id };
}

export async function handlePaymeRpc(body: PaymeRpcRequest): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const { method, params = {}, id } = body;

  switch (method) {
    case "CheckPerformTransaction":
      return checkPerformTransaction(id, params);
    case "CreateTransaction":
      return createTransaction(id, params);
    case "PerformTransaction":
      return performTransaction(id, params);
    case "CancelTransaction":
      return cancelTransaction(id, params);
    case "CheckTransaction":
      return checkTransaction(id, params);
    case "GetStatement":
      return getStatement(id, params);
    default:
      return rpcFailure(id, "METHOD_NOT_FOUND");
  }
}

async function checkPerformTransaction(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const amount = Number(params.amount);
  const orderId = resolveOrderId(params.account);
  if (!orderId || !Number.isFinite(amount)) {
    return rpcFailure(id, "INVALID_PARAMS");
  }

  const payment = await loadPayment(orderId);
  if (!payment) return rpcFailure(id, "ORDER_NOT_FOUND", "order_id");
  if (payment.status === "SUCCESS") return rpcFailure(id, "ORDER_ALREADY_PAID", "order_id");

  const expected = expectedAmountTiyin(payment);
  if (!expected || amount !== expected) {
    return rpcFailure(id, "INVALID_AMOUNT");
  }

  await insertPaymentEvent(payment.id, "payme_check_perform", params, "payme_merchant");
  return rpcSuccess(id, { allow: true });
}

async function createTransaction(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const paymeTransId = String(params.id ?? "");
  const time = Number(params.time);
  const amount = Number(params.amount);
  const orderId = resolveOrderId(params.account);

  if (!paymeTransId || !orderId || !Number.isFinite(time) || !Number.isFinite(amount)) {
    return rpcFailure(id, "INVALID_PARAMS");
  }

  const existing = await getPaymeTransaction(paymeTransId);
  if (existing) {
    return rpcSuccess(id, {
      create_time: existing.createTime,
      transaction: paymeTransId,
      state: existing.state,
    });
  }

  const payment = await loadPayment(orderId);
  if (!payment) return rpcFailure(id, "ORDER_NOT_FOUND", "order_id");
  if (payment.status === "SUCCESS") return rpcFailure(id, "ORDER_ALREADY_PAID", "order_id");

  const expected = expectedAmountTiyin(payment);
  if (!expected || amount !== expected) {
    return rpcFailure(id, "INVALID_AMOUNT");
  }

  await upsertPaymeTransaction({
    paymeTransId,
    paymentId: payment.id,
    state: PAYME_STATE.PENDING,
    amountTiyin: amount,
    createTime: time,
  });
  await insertPaymentEvent(payment.id, "payme_create", params, "payme_merchant");

  return rpcSuccess(id, {
    create_time: time,
    transaction: paymeTransId,
    state: PAYME_STATE.PENDING,
  });
}

async function performTransaction(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const paymeTransId = String(params.id ?? "");
  if (!paymeTransId) return rpcFailure(id, "INVALID_PARAMS");

  let tx = await getPaymeTransaction(paymeTransId);
  if (!tx) return rpcFailure(id, "TRANSACTION_NOT_FOUND");

  if (tx.state === PAYME_STATE.PAID) {
    return rpcSuccess(id, {
      perform_time: tx.performTime ?? tx.createTime,
      transaction: paymeTransId,
      state: PAYME_STATE.PAID,
    });
  }

  tx = await expireIfTimedOut(tx);
  if (tx.state !== PAYME_STATE.PENDING) {
    return rpcFailure(id, "UNABLE_TO_PERFORM");
  }

  const performTime = Date.now();
  await upsertPaymeTransaction({
    paymeTransId,
    paymentId: tx.paymentId,
    state: PAYME_STATE.PAID,
    amountTiyin: tx.amountTiyin,
    createTime: tx.createTime ?? undefined,
    performTime,
  });
  await activateSubscriptionFromPayment(tx.paymentId, "payme_merchant", params);

  return rpcSuccess(id, {
    perform_time: performTime,
    transaction: paymeTransId,
    state: PAYME_STATE.PAID,
  });
}

async function cancelTransaction(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const paymeTransId = String(params.id ?? "");
  if (!paymeTransId) return rpcFailure(id, "INVALID_PARAMS");

  const tx = await getPaymeTransaction(paymeTransId);
  if (!tx) return rpcFailure(id, "TRANSACTION_NOT_FOUND");

  const cancelTime = Date.now();
  const reasonRaw = Number(params.reason);
  const cancelReason = Number.isFinite(reasonRaw) ? reasonRaw : undefined;

  if (tx.state === PAYME_STATE.PAID) {
    await upsertPaymeTransaction({
      paymeTransId,
      paymentId: tx.paymentId,
      state: PAYME_STATE.PAID_CANCELLED,
      amountTiyin: tx.amountTiyin,
      createTime: tx.createTime ?? undefined,
      performTime: tx.performTime ?? undefined,
      cancelTime,
      cancelReason,
    });
    await reverseSubscriptionFromPayment(tx.paymentId, "payme_merchant", params);
    return rpcSuccess(id, {
      cancel_time: cancelTime,
      transaction: paymeTransId,
      state: PAYME_STATE.PAID_CANCELLED,
    });
  }

  if (tx.state === PAYME_STATE.PENDING) {
    await upsertPaymeTransaction({
      paymeTransId,
      paymentId: tx.paymentId,
      state: PAYME_STATE.PENDING_CANCELLED,
      amountTiyin: tx.amountTiyin,
      createTime: tx.createTime ?? undefined,
      cancelTime,
      cancelReason,
    });
    return rpcSuccess(id, {
      cancel_time: cancelTime,
      transaction: paymeTransId,
      state: PAYME_STATE.PENDING_CANCELLED,
    });
  }

  if (tx.state === PAYME_STATE.PENDING_CANCELLED || tx.state === PAYME_STATE.PAID_CANCELLED) {
    return rpcSuccess(id, {
      cancel_time: tx.cancelTime ?? cancelTime,
      transaction: paymeTransId,
      state: tx.state,
    });
  }

  return rpcFailure(id, "UNABLE_TO_CANCEL");
}

async function checkTransaction(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const paymeTransId = String(params.id ?? "");
  if (!paymeTransId) return rpcFailure(id, "INVALID_PARAMS");

  let tx = await getPaymeTransaction(paymeTransId);
  if (!tx) return rpcFailure(id, "TRANSACTION_NOT_FOUND");
  tx = await expireIfTimedOut(tx);

  return rpcSuccess(id, {
    create_time: tx.createTime,
    perform_time: tx.performTime ?? 0,
    cancel_time: tx.cancelTime ?? 0,
    transaction: paymeTransId,
    state: tx.state,
    reason: tx.cancelReason ?? null,
  });
}

async function getStatement(
  id: PaymeRpcRequest["id"],
  params: Record<string, unknown>
): Promise<PaymeRpcSuccess | PaymeRpcFailure> {
  const from = Number(params.from);
  const to = Number(params.to);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return rpcFailure(id, "INVALID_PARAMS");
  }

  return rpcSuccess(id, { transactions: [] });
}

export async function dispatchPaymeMethod(
  method: string,
  params?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await handlePaymeRpc({ method, params: params ?? {}, id: 1 });
  if ("error" in response) {
    throw response.error;
  }
  return response.result;
}