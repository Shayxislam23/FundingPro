import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/v1/subscriptions/current
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const paymentStatus = {
    integrationStatus: "pending_integration",
    paymentsEnabled: false,
    message: "Онлайн-оплата временно недоступна. Вы можете отправить запрос на подключение тарифа, и команда FundingPro свяжется с вами.",
  };

  return apiSuccess({ subscription: null, plan: null, status: "none", payment: paymentStatus });
}
