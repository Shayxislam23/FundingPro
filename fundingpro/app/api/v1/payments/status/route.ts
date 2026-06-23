export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { getPublicPaymentConfig } from "@/lib/payments";

// GET /api/v1/payments/status — public payment integration flags for UI
export async function GET() {
  return apiSuccess(getPublicPaymentConfig());
}
