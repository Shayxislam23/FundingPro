export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { listAdminConsultantOrders, updateConsultantOrderStatus } from "@/lib/db/consultant-orders";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }
  try {
    const orders = await listAdminConsultantOrders(50);
    return apiSuccess({ orders, total: orders.length });
  } catch (err) {
    console.error("GET /admin/consultant-orders error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }
  try {
    const body = await req.json();
    const orderId = String(body.orderId ?? "");
    const status = String(body.status ?? "");
    if (!orderId || !status) return apiError("orderId and status required", 400, "MISSING_FIELDS");
    await updateConsultantOrderStatus(orderId, status);
    return apiSuccess({ orderId, status });
  } catch (err) {
    console.error("PATCH /admin/consultant-orders error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
