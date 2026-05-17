import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/admin/dashboard
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalOrganizations,
    totalGrants,
    totalApplications,
    totalSupportTickets,
    activeSubscriptions,
    aiRequestsThisMonth,
    openTickets,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.organization.count(),
    prisma.grant.count({ where: { isActive: true } }),
    prisma.application.count(),
    prisma.supportTicket.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.aIRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true },
    }),
  ]);

  return apiSuccess({
    totalUsers,
    totalOrganizations,
    totalGrants,
    totalApplications,
    totalSupportTickets,
    activeSubscriptions,
    aiRequestsThisMonth,
    openTickets,
    recentUsers,
    integrationStatus: {
      payments: "pending_integration",
      paymentsEnabled: false,
      aiProvider: process.env.AI_PROVIDER ?? "mock",
    },
  });
}
