import { listGrants } from "@/lib/db/grants";
import { SEED_GRANTS } from "../../convex/seedData";

export type GrantSitemapEntry = {
  id: string;
  lastModified?: Date;
};

async function listGrantIdsFromConvex(): Promise<GrantSitemapEntry[]> {
  const entries: GrantSitemapEntry[] = [];
  let page = 1;
  let pages = 1;
  const limit = 100;

  do {
    const result = await listGrants({ page, limit });
    pages = result.pages;
    for (const grant of result.grants) {
      entries.push({
        id: grant.id,
        lastModified: grant.deadline ? new Date(grant.deadline) : undefined,
      });
    }
    page += 1;
  } while (page <= pages);

  return entries;
}

function seedGrantFallback(): GrantSitemapEntry[] {
  return SEED_GRANTS.map((grant) => ({ id: grant.key }));
}

/** Active grant IDs for sitemap.xml — Convex catalog with seed-key fallback. */
export async function listGrantSitemapEntries(): Promise<GrantSitemapEntry[]> {
  try {
    const entries = await listGrantIdsFromConvex();
    if (entries.length > 0) {
      return entries;
    }
  } catch {
    // Convex unavailable during build or missing env — use static seed slugs.
  }
  return seedGrantFallback();
}
