import { authApi } from "./client/auth";
import { grantsApi, type GrantsListParams } from "./client/grants";
import { paymentsApi } from "./client/payments";

export type { GrantsListParams };

export const api = {
  ...authApi,
  ...grantsApi,
  ...paymentsApi,
};
