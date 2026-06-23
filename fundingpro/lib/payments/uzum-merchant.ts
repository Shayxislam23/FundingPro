import {
  getPaymentById,
  getUzumTransaction,
  insertPaymentEvent,
  resolvePaymentIdFromParams,
  upsertUzumTransaction,
} from "@/lib/db/payments";
import { getUzumMerchantConfig } from "./config";
import { activateSubscriptionFromPayment, reverseSubscriptionFromPayment } from "./activate-subscription";
import type {
  UzumBaseRequest,
  UzumCheckRequest,
  UzumCreateRequest,
  UzumMerchantStatus,
} from "./types";

export class UzumMerchantError extends Error {
  constructor(public readonly errorCode: string) {
    super(errorCode);
    this.name = "UzumMerchantError";
  }
}

function nowTs(): string {
  return String(Date.now());
}

function merchantError(serviceId: string, errorCode: string) {
  return {
    serviceId,
    timestamp: nowTs(),
    status: "FAILED" as UzumMerchantStatus,
    errorCode,
  };
}

async function loadPayablePayment(paymentId: string) {
  const payment = await getPaymentById(paymentId);
  if (!payment) {
    throw new UzumMerchantError("ErrorCheckingPaymentData");
  }
  if (payment.status === "SUCCESS") {
    throw new UzumMerchantError("TransactionAlreadyConfirmed");
  }
  return payment;
}

export async function handleUzumCheck(body: UzumCheckRequest) {
  const { serviceId } = getUzumMerchantConfig();
  const paymentId = resolvePaymentIdFromParams(body.params);
  if (!paymentId) {
    return merchantError(body.serviceId ?? serviceId, "ErrorCheckingPaymentData");
  }

  try {
    const payment = await loadPayablePayment(paymentId);
    await insertPaymentEvent(payment.id, "uzum_check", body as unknown as Record<string, unknown>);
    return {
      serviceId: body.serviceId ?? serviceId,
      timestamp: nowTs(),
      status: "OK" as UzumMerchantStatus,
      data: body.params ?? { account: paymentId },
    };
  } catch (e) {
    const code = e instanceof UzumMerchantError ? e.errorCode : "ErrorCheckingPaymentData";
    return merchantError(body.serviceId ?? serviceId, code);
  }
}

export async function handleUzumCreate(body: UzumCreateRequest) {
  const { serviceId } = getUzumMerchantConfig();
  const paymentId = resolvePaymentIdFromParams(body.params);
  if (!paymentId || !body.transId) {
    return merchantError(body.serviceId ?? serviceId, "ErrorCheckingPaymentData");
  }

  try {
    const payment = await loadPayablePayment(paymentId);
    const expectedTiyin =
      payment.amountTiyin > 0
        ? payment.amountTiyin
        : Number(payment.metadata.amountTiyin ?? 0);

    if (!expectedTiyin || body.amount !== expectedTiyin) {
      throw new UzumMerchantError("ErrorCheckingPaymentData");
    }

    const existing = await getUzumTransaction(body.transId);
    if (existing) {
      return {
        serviceId: body.serviceId ?? serviceId,
        timestamp: nowTs(),
        status: "CREATED" as UzumMerchantStatus,
        transTime: existing.createTime ?? nowTs(),
        amount: existing.amountTiyin,
        transId: body.transId,
      };
    }

    const createTime = nowTs();
    await upsertUzumTransaction({
      transId: body.transId,
      paymentId: payment.id,
      serviceId: body.serviceId ?? serviceId,
      state: "CREATED",
      amountTiyin: body.amount,
      createTime,
    });
    await insertPaymentEvent(payment.id, "uzum_create", body as unknown as Record<string, unknown>);

    return {
      serviceId: body.serviceId ?? serviceId,
      timestamp: nowTs(),
      status: "CREATED" as UzumMerchantStatus,
      transTime: createTime,
      amount: body.amount,
      transId: body.transId,
    };
  } catch (e) {
    const code = e instanceof UzumMerchantError ? e.errorCode : "ErrorCheckingPaymentData";
    return merchantError(body.serviceId ?? serviceId, code);
  }
}

export async function handleUzumConfirm(body: UzumBaseRequest) {
  const { serviceId } = getUzumMerchantConfig();

  try {
    const tx = await getUzumTransaction(body.transId);
    if (!tx) throw new UzumMerchantError("TransactionNotFound");
    if (tx.state === "CONFIRMED") throw new UzumMerchantError("TransactionAlreadyConfirmed");

    const confirmTime = nowTs();
    await upsertUzumTransaction({
      transId: tx.transId,
      paymentId: tx.paymentId,
      serviceId: tx.serviceId,
      state: "CONFIRMED",
      amountTiyin: tx.amountTiyin,
      createTime: tx.createTime ?? undefined,
      confirmTime,
      reverseTime: tx.reverseTime ?? undefined,
    });
    await activateSubscriptionFromPayment(tx.paymentId, "uzum_merchant", body as unknown as Record<string, unknown>);

    return {
      serviceId: body.serviceId ?? serviceId,
      timestamp: nowTs(),
      status: "CONFIRMED" as UzumMerchantStatus,
      confirmTime,
      amount: tx.amountTiyin,
      transId: body.transId,
    };
  } catch (e) {
    const code = e instanceof UzumMerchantError ? e.errorCode : "TransactionNotFound";
    return merchantError(body.serviceId ?? serviceId, code);
  }
}

export async function handleUzumReverse(body: UzumBaseRequest) {
  const { serviceId } = getUzumMerchantConfig();

  try {
    const tx = await getUzumTransaction(body.transId);
    if (!tx) throw new UzumMerchantError("TransactionNotFound");

    const reverseTime = nowTs();
    await upsertUzumTransaction({
      transId: tx.transId,
      paymentId: tx.paymentId,
      serviceId: tx.serviceId,
      state: "REVERSED",
      amountTiyin: tx.amountTiyin,
      createTime: tx.createTime ?? undefined,
      confirmTime: tx.confirmTime ?? undefined,
      reverseTime,
    });
    await reverseSubscriptionFromPayment(tx.paymentId, "uzum_merchant", body as unknown as Record<string, unknown>);

    return {
      serviceId: body.serviceId ?? serviceId,
      timestamp: nowTs(),
      status: "REVERSED" as UzumMerchantStatus,
      reverseTime,
      amount: tx.amountTiyin,
      transId: body.transId,
    };
  } catch (e) {
    const code = e instanceof UzumMerchantError ? e.errorCode : "TransactionNotFound";
    return merchantError(body.serviceId ?? serviceId, code);
  }
}

export async function handleUzumStatus(body: UzumBaseRequest) {
  const { serviceId } = getUzumMerchantConfig();

  try {
    const tx = await getUzumTransaction(body.transId);
    if (!tx) throw new UzumMerchantError("TransactionNotFound");

    return {
      serviceId: body.serviceId ?? serviceId,
      timestamp: nowTs(),
      status: tx.state === "CONFIRMED" ? "CONFIRMED" : tx.state === "REVERSED" ? "REVERSED" : "CREATED",
      transId: body.transId,
      transTime: tx.createTime,
      confirmTime: tx.confirmTime,
      reverseTime: tx.reverseTime,
      amount: tx.amountTiyin,
    };
  } catch (e) {
    const code = e instanceof UzumMerchantError ? e.errorCode : "TransactionNotFound";
    return merchantError(body.serviceId ?? serviceId, code);
  }
}
