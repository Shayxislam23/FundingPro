import { ZoomradGrantsClient } from "@/components/partners/ZoomradGrantsClient";
import { listPublicGrants } from "@/lib/public-grants";

type PageProps = {
  searchParams: Promise<{ channel?: string; lang?: string; session?: string }>;
};

export default async function ZoomradGrantsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  let grants: Awaited<ReturnType<typeof listPublicGrants>>["grants"] = [];
  try {
    const result = await listPublicGrants({ country: "Uzbekistan", page: 1, limit: 12 });
    grants = result.grants;
  } catch {
    grants = [];
  }

  return <ZoomradGrantsClient initialGrants={grants} searchParams={sp} />;
}
