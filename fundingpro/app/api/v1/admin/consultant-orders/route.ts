export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { listAdminConsultantOrders, updateConsultantOrderStatus } from "@/lib/db/consultant-orders";

export const GET = withAdmin(async () => {
  const orders = await listAdminConsultantOrders(50);
  return apiSuccess({ orders, total: orders.length });
});

export const PATCH = withAdmin(async (req) => {
  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  const status = String(body.status ?? "");
  if (!orderId || !status) return apiError("orderId and status required", 400, "MISSING_FIELDS");

  await updateConsultantOrderStatus(orderId, status);
  return apiSuccess({ orderId, status });
});
