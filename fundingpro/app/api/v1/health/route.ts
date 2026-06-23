export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { grantsHealthCheck } from "@/lib/db/grants";
import { getCompanyHealthLabel } from "@/lib/company-info";
import {
  getPaymentIntegrationStatus,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "@/lib/payments";

export async function GET() {
  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    await grantsHealthCheck();
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "unknown";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const isProduction = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      status,
      service: "FundingPro API",
      version: "1.0.0-beta",
      company: getCompanyHealthLabel(),
      timestamp: new Date().toISOString(),
      database: isProduction ? { status: dbStatus } : { status: dbStatus, error: dbError },
      ai: isProduction ? { status: "ok" } : { provider: process.env.AI_PROVIDER ?? "mock" },
      payments: isProduction
        ? { enabled: isPaymentsEnabled() }
        : {
            enabled: isPaymentsEnabled(),
            integrationStatus: getPaymentIntegrationStatus(),
            provider: "uzum",
            merchantConfigured: isUzumMerchantConfigured(),
            checkoutConfigured: isUzumCheckoutConfigured(),
          },
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
