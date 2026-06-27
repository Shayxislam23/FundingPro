import type { MetadataRoute } from "next";
import { LEGAL_DOCUMENTS } from "@/lib/legal/meta";
import { listGrantSitemapEntries } from "@/lib/seo/grant-sitemap";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/grants"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/how-it-works"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/stories"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/donors"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const grantEntries = await listGrantSitemapEntries();
  const grantPages: MetadataRoute.Sitemap = grantEntries.map((grant) => ({
    url: absoluteUrl(`/grants/${grant.id}`),
    lastModified: grant.lastModified ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const legalPages: MetadataRoute.Sitemap = LEGAL_DOCUMENTS.map((doc) => ({
    url: absoluteUrl(doc.path),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...grantPages, ...legalPages];
}
