export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { getPublicPaymentConfig } from "@/lib/payments";

// GET /api/v1/payments/status — public payment integration flags for UI
export const GET = withPublic(async () => {
  return apiSuccess(getPublicPaymentConfig());
});
