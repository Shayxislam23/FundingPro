import {
  getPaymentById,
  insertPaymentEvent,
  updatePaymentProviderRef,
} from "@/lib/db/payments";
import { activateSubscriptionFromPayment } from "../../activate-subscription";
import { getUzumCheckoutConfig, isUzumCheckoutConfigured } from "../../config";
import { tiyinToUzs } from "../../pricing";
import type { CheckoutSessionResult } from "../../types";

type RegisterResponse = {
  orderId?: string;
  paymentUrl?: string;
  redirectUrl?: string;
  url?: string;
  status?: string;
};

type OrderStatusResponse = {
  status?: string;
  orderStatus?: string;
  state?: string;
};

async function uzumCheckoutFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { baseUrl, terminalId, secret } = getUzumCheckoutConfig();
  const auth = Buffer.from(`${terminalId}:${secret}`, "utf8").toString("base64");

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Uzum Checkout error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function registerUzumCheckout(
  paymentId: string,
  accessToken: string,
  options?: { returnUrl?: string }
): Promise<CheckoutSessionResult> {
  const payment = await getPaymentById(paymentId, accessToken);
  if (!payment) throw new Error("Payment not found");

  const amountTiyin =
    payment.amountTiyin > 0
      ? payment.amountTiyin
      : Number(payment.metadata.amountTiyin ?? 0);
  const amountUzs = tiyinToUzs(amountTiyin);
  const baseReturnUrl = options?.returnUrl ?? getUzumCheckoutConfig().returnUrl;
  const checkoutOrderId = paymentId;

  if (!isUzumCheckoutConfigured()) {
    const mockUrl = `${baseReturnUrl}?paymentId=${paymentId}&mock=1&status=success`;
    await updatePaymentProviderRef(paymentId, checkoutOrderId, {
      checkoutOrderId,
      checkoutMock: true,
    });
    await insertPaymentEvent(paymentId, "checkout_register_mock", { redirectUrl: mockUrl });
    return { paymentId, redirectUrl: mockUrl, checkoutOrderId };
  }

  const payload = {
    orderId: checkoutOrderId,
    amount: amountUzs,
    currency: "UZS",
    returnUrl: `${baseReturnUrl}?paymentId=${paymentId}`,
    description: `FundingPro subscription ${String(payment.metadata.planName ?? "")}`.trim(),
  };

  const result = await uzumCheckoutFetch<RegisterResponse>("/api/v1/payment/register", payload);
  const redirectUrl = result.paymentUrl ?? result.redirectUrl ?? result.url;
  if (!redirectUrl) {
    throw new Error("Uzum Checkout did not return redirect URL");
  }

  const orderId = result.orderId ?? checkoutOrderId;
  await updatePaymentProviderRef(paymentId, orderId, { checkoutOrderId: orderId });
  await insertPaymentEvent(paymentId, "checkout_register", { orderId, redirectUrl });

  return { paymentId, redirectUrl, checkoutOrderId: orderId };
}

export async function syncUzumCheckoutStatus(
  paymentId: string,
  accessToken: string
): Promise<{
  paymentId: string;
  status: string;
  activated: boolean;
}> {
  const payment = await getPaymentById(paymentId, accessToken);
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "SUCCESS") {
    return { paymentId, status: "SUCCESS", activated: true };
  }

  const meta = payment.metadata;
  if (meta.checkoutMock) {
    await activateSubscriptionFromPayment(paymentId, "uzum_checkout_mock", { mock: true });
    return { paymentId, status: "SUCCESS", activated: true };
  }

  if (!isUzumCheckoutConfigured()) {
    return { paymentId, status: payment.status, activated: false };
  }

  const orderId = payment.providerRefId ?? String(meta.checkoutOrderId ?? paymentId);
  const result = await uzumCheckoutFetch<OrderStatusResponse>("/api/v1/payment/getOrderStatus", {
    orderId,
  });

  const remoteStatus = (result.status ?? result.orderStatus ?? result.state ?? "").toUpperCase();
  await insertPaymentEvent(paymentId, "checkout_status", result as unknown as Record<string, unknown>);

  const paid = ["SUCCESS", "PAID", "CONFIRMED", "COMPLETED"].includes(remoteStatus);
  if (paid) {
    await activateSubscriptionFromPayment(paymentId, "uzum_checkout", result as unknown as Record<string, unknown>);
    return { paymentId, status: "SUCCESS", activated: true };
  }

  return { paymentId, status: remoteStatus || payment.status, activated: false };
}
