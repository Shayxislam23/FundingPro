export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { listPublicStories } from "@/lib/public-stories";

export const GET = withPublic(async () => {
  const result = await listPublicStories();
  return apiSuccess(result);
});
