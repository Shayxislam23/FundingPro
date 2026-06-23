export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { listConsultants } from "@/lib/db/consultants";

export const GET = withActiveUser(async (req) => {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const result = await listConsultants({
    specialty: specialty || undefined,
    country: country || undefined,
    page,
    limit,
  });
  return apiSuccess(result);
});
