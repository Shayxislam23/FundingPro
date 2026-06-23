export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withUzumMerchant } from "@/lib/payments/uzum-route";
import { handleUzumCreate } from "@/lib/payments/uzum-merchant";
import type { UzumCreateRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  return withUzumMerchant<UzumCreateRequest>(req, handleUzumCreate);
}
