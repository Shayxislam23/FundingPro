export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { listGrants } from "@/lib/db/grants";
import { parsePagination, sanitizeLikePattern } from "@/lib/validation";

export const GET = withPublic(async (req) => {
  const { searchParams } = new URL(req.url);
  const donorId = searchParams.get("donor") ?? "";
  const deadlineBefore = searchParams.get("deadlineBefore") ?? "";
  const q = searchParams.get("q") ?? "";
  const search = searchParams.get("search") ?? q;
  const sector = searchParams.get("sector") ?? "";
  const country = searchParams.get("country") ?? "";
  const featured = searchParams.get("featured") === "true";
  const { page, limit } = parsePagination(searchParams);

  const safeSearch = search ? sanitizeLikePattern(search) : "";

  const result = await listGrants({
    search: safeSearch || undefined,
    sector: sector || undefined,
    country: country || undefined,
    donorId: donorId || undefined,
    deadlineBefore: deadlineBefore || undefined,
    featured,
    page,
    limit,
  });

  return apiSuccess(result);
});
