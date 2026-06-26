export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { listPublicDonors } from "@/lib/db/donors";

export const GET = withPublic(async () => {
  const result = await listPublicDonors();
  return apiSuccess(result);
});
