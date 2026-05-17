import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/v1/grants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const sector = searchParams.get("sector") ?? "";
    const country = searchParams.get("country") ?? "";
    const donorId = searchParams.get("donor") ?? "";
    const applicantType = searchParams.get("applicantType") ?? "";
    const featured = searchParams.get("featured") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.GrantWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(sector && { sector: { has: sector } }),
      ...(country && { country: { has: country } }),
      ...(donorId && { donorId }),
      ...(applicantType && { eligibleTypes: { has: applicantType } }),
      ...(featured && { isFeatured: true }),
    };

    const [grants, total] = await Promise.all([
      prisma.grant.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { deadline: "asc" }],
        include: {
          donor: { select: { id: true, shortName: true, name: true } },
        },
      }),
      prisma.grant.count({ where }),
    ]);

    return apiSuccess({ grants, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("GET /grants error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
