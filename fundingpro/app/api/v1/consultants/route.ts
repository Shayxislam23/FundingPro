import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const skip = (page - 1) * limit;

  const where = {
    isVerified: true,
    isActive: true,
    ...(specialty && { specialties: { has: specialty } }),
    ...(country && { country }),
  };

  const [consultants, total] = await Promise.all([
    prisma.consultantProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      include: {
        organization: {
          select: { id: true, name: true, country: true, sector: true, website: true },
        },
      },
    }),
    prisma.consultantProfile.count({ where }),
  ]);

  return apiSuccess({ consultants, total, page, limit, pages: Math.ceil(total / limit) });
}
