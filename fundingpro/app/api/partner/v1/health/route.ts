export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PARTNER_API_VERSION } from "@/lib/partner-api/constants";
import { partnerApiEnvironment } from "@/lib/partner-api/server";

/** GET /v1/health — no API key required. */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: PARTNER_API_VERSION,
      environment: partnerApiEnvironment(),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
