export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withUzumMerchant } from "@/lib/payments/uzum-route";
import { handleUzumStatus } from "@/lib/payments/uzum-merchant";
import type { UzumBaseRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  return withUzumMerchant<UzumBaseRequest>(req, handleUzumStatus);
}
