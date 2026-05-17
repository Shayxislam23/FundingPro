import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "FundingPro API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    company: "Beta Version Solutions ООО, DGU No. 61712",
  });
}
