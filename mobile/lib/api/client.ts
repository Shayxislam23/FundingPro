import { authApi } from "./client/auth";
import { grantsApi, type GrantsListParams } from "./client/grants";
import { labApi } from "./client/lab";
import { paymentsApi } from "./client/payments";

export type { GrantsListParams };
export type { LabProfileUpdate } from "./client/lab";

export const api = {
  ...authApi,
  ...grantsApi,
  ...paymentsApi,
  ...labApi,
};
