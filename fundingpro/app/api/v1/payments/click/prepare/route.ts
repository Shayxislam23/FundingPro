export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { handleClickPrepare } from "@/lib/payments/providers/click/shop";
import { isClickConfigured, isPaymentsEnabled } from "@/lib/payments/config";
import type { ClickShopRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  if (!isPaymentsEnabled() || !isClickConfigured()) {
    return NextResponse.json(
      { error: -8, error_note: "Payments not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as ClickShopRequest;
    const result = await handleClickPrepare(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Click prepare error:", err);
    return NextResponse.json({ error: -8, error_note: "Internal error" }, { status: 500 });
  }
}
