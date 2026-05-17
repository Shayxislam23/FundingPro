import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser, getCurrentOrganization } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/me
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const [user, orgMembership, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, email: true, emailVerified: true, isActive: true, createdAt: true },
    }),
    getCurrentOrganization(authUser.userId),
    prisma.subscription.findFirst({
      where: { userId: authUser.userId, status: "ACTIVE" },
      include: { plan: { select: { name: true, nameRu: true, priceUsd: true, targetType: true } } },
    }),
  ]);

  if (!user) return apiError("User not found", 404, "NOT_FOUND");

  return apiSuccess({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    organization: orgMembership
      ? {
          id: orgMembership.organization.id,
          name: orgMembership.organization.name,
          type: orgMembership.organization.type,
          role: orgMembership.role,
        }
      : null,
    subscription: subscription
      ? { plan: subscription.plan.nameRu ?? subscription.plan.name, status: subscription.status }
      : null,
    paymentIntegrationStatus: "pending_integration",
  });
}
