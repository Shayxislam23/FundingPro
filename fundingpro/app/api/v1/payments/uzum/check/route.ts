export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withUzumMerchant } from "@/lib/payments/uzum-route";
import { handleUzumCheck } from "@/lib/payments/uzum-merchant";
import type { UzumCheckRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  return withUzumMerchant<UzumCheckRequest>(req, handleUzumCheck);
}
