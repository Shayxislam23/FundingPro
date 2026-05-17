import { NextRequest } from "next/server";
import { apiSuccess, apiError, getAuthUser } from "@/lib/api";

// GET /api/v1/grants
export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const sector = searchParams.get("sector") ?? "";
    const country = searchParams.get("country") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    // TODO: query database with filters
    // TODO: apply full-text search (Elasticsearch/OpenSearch-ready)
    // TODO: include AI match score for user profile

    return apiSuccess({
      grants: [],
      total: 0,
      page,
      limit,
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
