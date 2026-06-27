export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withPublic } from "@/lib/api-route";
import { grantsHealthCheck } from "@/lib/db/grants";
import { getCompanyHealthLabel } from "@/lib/company-info";
import { buildHealthPayload, healthHttpStatus } from "@/lib/health-response";

export const GET = withPublic(async () => {
  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    await grantsHealthCheck();
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "unknown";
  }

  const payload = buildHealthPayload({
    dbStatus,
    dbError,
    company: getCompanyHealthLabel(),
    aiProvider: process.env.AI_PROVIDER ?? "mock",
  });

  return NextResponse.json(payload, { status: healthHttpStatus(payload) });
});
