export type PaymentProviderName = "uzum" | "payment_provider";

export type UzumTransactionState = "PENDING" | "CREATED" | "CONFIRMED" | "REVERSED";

export type UzumMerchantStatus = "OK" | "CREATED" | "CONFIRMED" | "REVERSED" | "FAILED";

export type UzumMerchantParams = {
  account?: string | number;
  orderId?: string | number;
  order_id?: string | number;
};

export type UzumCheckRequest = {
  serviceId: string;
  timestamp?: number | string;
  params?: UzumMerchantParams;
};

export type UzumCreateRequest = UzumCheckRequest & {
  transId: string;
  amount: number;
};

export type UzumBaseRequest = {
  serviceId: string;
  timestamp?: number | string;
  transId: string;
};

export type PaymentIntentResult = {
  paymentId: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  amountUsd: number;
  amountUzs: number;
  amountTiyin: number;
  currency: "UZS";
  provider: PaymentProviderName;
  uzumAppUrl: string | null;
};

export type CheckoutSessionResult = {
  paymentId: string;
  redirectUrl: string;
  checkoutOrderId: string;
};

export type PaymentRequestResult =
  | { status: "pending_integration"; message: string }
  | { status: "ready"; message: string };
