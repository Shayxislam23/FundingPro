export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import {
  createConsultantOrder,
  ensureUserForOrder,
  listUserConsultantOrders,
} from "@/lib/db/consultant-orders";
import { createSupabaseAdmin } from "@/lib/supabase-server";

function parseAmountUsd(price: string | number): number {
  if (typeof price === "number") return price;
  const match = price.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// GET /api/v1/consultant-orders
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const orders = await listUserConsultantOrders(authUser.userId);
    return apiSuccess({ orders });
  } catch (err) {
    console.error("GET /consultant-orders error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}

// POST /api/v1/consultant-orders
export async function POST(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const { consultantId, packageName, amountUsd, price, notes } = body;

    if (!consultantId || !packageName?.trim()) {
      return apiError("consultantId and packageName required", 400, "MISSING_FIELDS");
    }

    await ensureUserForOrder(authUser.supabaseId, authUser.email);

    const supabase = createSupabaseAdmin();
    const { data: consultant } = await supabase
      .from("consultant_profiles")
      .select("id, full_name, is_active, is_verified")
      .eq("id", consultantId)
      .maybeSingle();

    if (!consultant) return apiError("Consultant not found", 404, "NOT_FOUND");

    const amount = amountUsd != null ? Number(amountUsd) : parseAmountUsd(price ?? "0");
    if (!amount || amount <= 0) {
      return apiError("Valid amount required", 400, "INVALID_AMOUNT");
    }

    const result = await createConsultantOrder({
      userId: authUser.userId,
      email: authUser.email,
      consultantId,
      packageName: packageName.trim(),
      amountUsd: amount,
      notes: notes?.trim(),
    });

    await writeAuditLog({
      userId: authUser.userId,
      action: "consultant_order_create",
      entityType: "consultant_order",
      entityId: result.orderId,
      metadata: { consultantId, packageName, amountUsd: amount },
    });

    return apiSuccess(result, 201);
  } catch (err) {
    console.error("POST /consultant-orders error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
