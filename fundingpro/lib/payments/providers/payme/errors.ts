/** Payme Merchant API error codes (subset). */
export const PAYME_ERRORS = {
  INVALID_JSON: { code: -32700, message: "JSON parse error" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS: { code: -32602, message: "Invalid params" },
  INSUFFICIENT_PRIVILEGE: { code: -32504, message: "Insufficient privilege" },
  INTERNAL_ERROR: { code: -32400, message: "Internal error" },
  INVALID_AMOUNT: { code: -31001, message: "Invalid amount" },
  TRANSACTION_NOT_FOUND: { code: -31003, message: "Transaction not found" },
  UNABLE_TO_PERFORM: { code: -31008, message: "Unable to perform" },
  ORDER_NOT_FOUND: { code: -31050, message: "Order not found" },
  ORDER_ALREADY_PAID: { code: -31051, message: "Order already paid" },
  UNABLE_TO_CANCEL: { code: -31007, message: "Unable to cancel" },
} as const;

export type PaymeErrorKey = keyof typeof PAYME_ERRORS;

export function paymeError(key: PaymeErrorKey, data?: string | null) {
  const err = PAYME_ERRORS[key];
  return {
    code: err.code,
    message: err.message,
    ...(data !== undefined ? { data } : {}),
  };
}

export type PaymeRpcRequest = {
  method: string;
  params?: Record<string, unknown>;
  id: number | string;
};

export type PaymeRpcSuccess = {
  result: Record<string, unknown>;
  id: number | string;
};

export type PaymeRpcFailure = {
  error: ReturnType<typeof paymeError>;
  id: number | string | null;
};

export type PaymeTransactionState = 1 | 2 | -1 | -2;

export const PAYME_STATE = {
  PENDING: 1 as PaymeTransactionState,
  PAID: 2 as PaymeTransactionState,
  PENDING_CANCELLED: -1 as PaymeTransactionState,
  PAID_CANCELLED: -2 as PaymeTransactionState,
};
