export type PaymentProviderId = "uzum" | "payme" | "click";

/** @deprecated Use PaymentProviderId */
export type PaymentProviderName = PaymentProviderId | "payment_provider";

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

export type ProviderStatusEntry = {
  id: PaymentProviderId;
  enabled: boolean;
  configured: boolean;
  label: string;
  methods: string[];
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
  provider: PaymentProviderId;
  uzumAppUrl?: string | null;
  paymeCheckoutUrl?: string | null;
  clickPayUrl?: string | null;
};

export type CheckoutSessionResult = {
  paymentId: string;
  redirectUrl: string;
  checkoutOrderId: string;
};

export type PaymentRequestResult =
  | { status: "pending_integration"; message: string }
  | { status: "ready"; message: string };

export type PublicPaymentConfig = {
  paymentsEnabled: boolean;
  integrationStatus: string;
  provider?: string;
  providers: ProviderStatusEntry[];
  merchantConfigured?: boolean;
  checkoutConfigured?: boolean;
  message: string;
};

export type PaymeJsonRpcRequest = {
  jsonrpc?: string;
  method: string;
  params?: Record<string, unknown>;
  id?: number | string | null;
};

export type PaymeJsonRpcResponse = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string | Record<string, string>;
    data?: string | null;
  };
};

export type ClickShopRequest = {
  click_trans_id: number | string;
  service_id: number | string;
  click_paydoc_id?: number | string;
  merchant_trans_id: string;
  amount: number | string;
  action: number | string;
  error?: number | string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
  merchant_prepare_id?: number | string;
};
