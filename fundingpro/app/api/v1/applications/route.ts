import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/applications
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const skip = (page - 1) * limit;

  const where = {
    userId: authUser.userId,
    ...(status && { status: status as never }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        grant: {
          select: {
            id: true,
            title: true,
            deadline: true,
            amountMin: true,
            amountMax: true,
            currency: true,
            donor: { select: { shortName: true } },
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  return apiSuccess({ applications, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/v1/applications
export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const { grantId, notes } = body;

    if (!grantId) return apiError("grantId required", 400, "MISSING_FIELDS");

    // Verify grant exists
    const grant = await prisma.grant.findUnique({ where: { id: grantId, isActive: true } });
    if (!grant) return apiError("Grant not found", 404, "GRANT_NOT_FOUND");

    // Prevent duplicate applications
    const existing = await prisma.application.findFirst({
      where: { userId: authUser.userId, grantId },
    });
    if (existing) {
      return apiSuccess({ applicationId: existing.id, status: existing.status, alreadyExists: true });
    }

    const application = await prisma.application.create({
      data: {
        userId: authUser.userId,
        grantId,
        status: "SAVED",
        notes: notes ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "application_create",
        entityType: "Application",
        entityId: application.id,
        metadata: { grantId, status: "SAVED" },
      },
    });

    return apiSuccess({ applicationId: application.id, status: application.status }, 201);
  } catch (err) {
    console.error("POST /applications error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
