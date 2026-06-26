export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import {
  createConsultantOrder,
  ensureUserForOrder,
  listConsultants,
  listUserConsultantOrders,
} from "@/lib/db/consultant-orders";

function parseAmountUsd(price: string | number): number {
  if (typeof price === "number") return price;
  const match = price.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export const GET = withActiveUser(async (_req, authUser) => {
  const orders = await listUserConsultantOrders(authUser.accessToken);
  return apiSuccess({ orders });
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { consultantId, packageName, amountUsd, price, notes } = body;

  if (!consultantId || !packageName?.trim()) {
    return apiError("consultantId and packageName required", 400, "MISSING_FIELDS");
  }

  await ensureUserForOrder(authUser.email, authUser.accessToken);

  const consultants = await listConsultants({
    page: 1,
    limit: 100,
  });
  const consultant = consultants.consultants.find((c) => c.id === consultantId);
  if (!consultant) return apiError("Consultant not found", 404, "NOT_FOUND");

  const amount = amountUsd != null ? Number(amountUsd) : parseAmountUsd(price ?? "0");
  if (!amount || amount <= 0) {
    return apiError("Valid amount required", 400, "INVALID_AMOUNT");
  }

  const result = await createConsultantOrder(
    {
      consultantId,
      packageName: packageName.trim(),
      amountUsd: amount,
      notes: notes?.trim(),
    },
    authUser.accessToken
  );

  await writeAuditLog({
    userId: authUser.userId,
    action: "consultant_order_create",
    entityType: "consultant_order",
    entityId: result.orderId,
  });

  return apiSuccess(result, 201);
});
