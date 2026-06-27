import {
  getPaymentIntegrationStatus,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "./payments";

export type HealthDatabaseSection = { status: string } | { status: string; error: string | null };

export type HealthPayload = {
  status: string;
  service: string;
  version: string;
  company: string;
  timestamp: string;
  database: HealthDatabaseSection;
  ai: { status: string } | { provider: string };
  payments:
    | { enabled: boolean }
    | {
        enabled: boolean;
        integrationStatus: ReturnType<typeof getPaymentIntegrationStatus>;
        provider: string;
        merchantConfigured: boolean;
        checkoutConfigured: boolean;
      };
};

export function buildHealthPayload(params: {
  dbStatus: string;
  dbError: string | null;
  company: string;
  isProduction?: boolean;
  aiProvider?: string;
  now?: string;
}): HealthPayload {
  const isProduction = params.isProduction ?? process.env.NODE_ENV === "production";
  const status = params.dbStatus === "ok" ? "ok" : "degraded";

  return {
    status,
    service: "FundingPro API",
    version: "1.0.0-beta",
    company: params.company,
    timestamp: params.now ?? new Date().toISOString(),
    database: isProduction
      ? { status: params.dbStatus }
      : { status: params.dbStatus, error: params.dbError },
    ai: isProduction ? { status: "ok" } : { provider: params.aiProvider ?? "mock" },
    payments: isProduction
      ? { enabled: isPaymentsEnabled() }
      : {
          enabled: isPaymentsEnabled(),
          integrationStatus: getPaymentIntegrationStatus(),
          provider: "uzum",
          merchantConfigured: isUzumMerchantConfigured(),
          checkoutConfigured: isUzumCheckoutConfigured(),
        },
  };
}

export function healthHttpStatus(payload: HealthPayload): number {
  return payload.status === "ok" ? 200 : 503;
}
