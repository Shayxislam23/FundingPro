import {
  api,
  convexPublicQuery,
  convexMutation,
  convexQuery,
  convexInternalMutation,
  convexInternalQuery,
  internal,
} from "@/lib/convex-server";
import type { PaymentProviderId, UzumTransactionState } from "@/lib/payments/types";

export type PaymentRecord = {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amountUsd: number;
  amountTiyin: number;
  currency: string;
  status: string;
  provider: string;
  providerRefId: string | null;
  idempotencyKey: string;
  serviceType: string;
  metadata: Record<string, unknown>;
};

export type UzumTransactionRecord = {
  transId: string;
  paymentId: string;
  serviceId: string;
  state: UzumTransactionState;
  amountTiyin: number;
  createTime: string | null;
  confirmTime: string | null;
  reverseTime: string | null;
};

export type PaymeTransactionRecord = {
  paymeTransId: string;
  paymentId: string;
  state: number;
  amountTiyin: number;
  createTime: number | null;
  performTime: number | null;
  cancelTime: number | null;
  cancelReason: number | null;
};

export type ClickTransactionRecord = {
  clickTransId: string;
  paymentId: string;
  state: string;
  amountTiyin: number;
  merchantPrepareId: string | null;
  merchantConfirmId: string | null;
};

export async function getPlanPricing(planId: string) {
  return convexPublicQuery(api.plans.getPricing, { planId });
}

export async function createPaymentIntent(
  input: {
    planId: string;
    planName: string;
    amountUsd: number;
    amountUzs: number;
    amountTiyin: number;
    provider: PaymentProviderId;
  },
  accessToken: string
) {
  return convexMutation(api.payments.createIntent, input, accessToken);
}

export async function getPaymentById(
  paymentId: string,
  accessToken: string
): Promise<PaymentRecord | null> {
  return convexQuery(api.payments.getById, { paymentId }, accessToken);
}

export async function getPaymentByIdInternal(
  paymentId: string
): Promise<PaymentRecord | null> {
  return convexInternalQuery(internal.paymentsInternal.getById, {
    paymentId,
  }) as Promise<PaymentRecord | null>;
}

export function resolvePaymentIdFromParams(params?: {
  account?: string | number;
  orderId?: string | number;
  order_id?: string | number;
}): string | null {
  if (!params) return null;
  const raw = params.account ?? params.orderId ?? params.order_id;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

export async function insertPaymentEvent(
  paymentId: string,
  eventType: string,
  payload: Record<string, unknown>,
  source = "uzum_webhook"
) {
  return convexInternalMutation(internal.paymentsInternal.insertEvent, {
    paymentId,
    eventType,
    payload,
    source,
  });
}

export async function getUzumTransaction(
  transId: string
): Promise<UzumTransactionRecord | null> {
  return convexInternalQuery(internal.paymentsInternal.getUzumTransaction, {
    transId,
  }) as Promise<UzumTransactionRecord | null>;
}

export async function upsertUzumTransaction(input: {
  transId: string;
  paymentId: string;
  serviceId: string;
  state: UzumTransactionState;
  amountTiyin: number;
  createTime?: string;
  confirmTime?: string;
  reverseTime?: string;
}) {
  return convexInternalMutation(internal.paymentsInternal.upsertUzumTransaction, input);
}

export async function updatePaymentProviderRef(
  paymentId: string,
  providerRefId: string,
  extraMetadata?: Record<string, unknown>
) {
  return convexInternalMutation(internal.paymentsInternal.updateProviderRef, {
    paymentId,
    providerRefId,
    extraMetadata,
  });
}

export async function setPaymentStatus(
  paymentId: string,
  status: string,
  activatedAt?: Date
) {
  return convexInternalMutation(internal.paymentsInternal.setStatus, {
    paymentId,
    status,
    activatedAt: activatedAt?.getTime(),
  });
}

export async function activateSubscriptionForPayment(paymentId: string) {
  return convexInternalMutation(internal.paymentsInternal.activateSubscription, { paymentId });
}

export async function reverseSubscriptionForPayment(paymentId: string) {
  return convexInternalMutation(internal.paymentsInternal.reverseSubscription, { paymentId });
}

export async function getPaymeTransaction(
  paymeTransId: string
): Promise<PaymeTransactionRecord | null> {
  return convexInternalQuery(internal.paymentsInternal.getPaymeTransaction, {
    paymeTransId,
  }) as Promise<PaymeTransactionRecord | null>;
}

export async function upsertPaymeTransaction(input: {
  paymeTransId: string;
  paymentId: string;
  state: number;
  amountTiyin: number;
  createTime?: number;
  performTime?: number;
  cancelTime?: number;
  cancelReason?: number;
}) {
  return convexInternalMutation(internal.paymentsInternal.upsertPaymeTransaction, input);
}

export async function getClickTransaction(
  clickTransId: string
): Promise<ClickTransactionRecord | null> {
  return convexInternalQuery(internal.paymentsInternal.getClickTransaction, {
    clickTransId,
  }) as Promise<ClickTransactionRecord | null>;
}

export async function upsertClickTransaction(input: {
  clickTransId: string;
  paymentId: string;
  state: string;
  amountTiyin: number;
  merchantPrepareId?: string;
  merchantConfirmId?: string;
}) {
  return convexInternalMutation(internal.paymentsInternal.upsertClickTransaction, input);
}
