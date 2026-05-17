import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/subscriptions/current
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: authUser.userId, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const paymentStatus = {
    integrationStatus: "pending_integration",
    paymentsEnabled: false,
    message: "Онлайн-оплата временно недоступна. Вы можете отправить запрос на подключение тарифа, и команда FundingPro свяжется с вами.",
  };

  if (!subscription) {
    return apiSuccess({ subscription: null, plan: null, status: "none", payment: paymentStatus });
  }

  return apiSuccess({
    subscription: { id: subscription.id, status: subscription.status, startDate: subscription.startDate, endDate: subscription.endDate },
    plan: { id: subscription.plan.id, name: subscription.plan.name, nameRu: subscription.plan.nameRu, priceUsd: subscription.plan.priceUsd, features: subscription.plan.features },
    status: subscription.status,
    payment: paymentStatus,
  });
}
