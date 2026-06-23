import {
  activateSubscriptionForPayment,
  insertPaymentEvent,
  reverseSubscriptionForPayment,
} from "@/lib/db/payments";

export async function activateSubscriptionFromPayment(
  paymentId: string,
  source: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await activateSubscriptionForPayment(paymentId);
  await insertPaymentEvent(paymentId, "payment_confirmed", payload, source);
}

export async function reverseSubscriptionFromPayment(
  paymentId: string,
  source: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await reverseSubscriptionForPayment(paymentId);
  await insertPaymentEvent(paymentId, "payment_reversed", payload, source);
}
