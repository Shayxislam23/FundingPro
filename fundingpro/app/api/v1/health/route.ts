import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "unknown";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      service: "FundingPro API",
      version: "1.0.0-beta",
      company: "Beta Version Solutions ООО, DGU No. 61712",
      timestamp: new Date().toISOString(),
      database: { status: dbStatus, error: dbError },
      ai: { provider: process.env.AI_PROVIDER ?? "mock" },
      payments: {
        enabled: process.env.PAYMENTS_ENABLED === "true",
        integrationStatus: "pending_integration",
      },
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
