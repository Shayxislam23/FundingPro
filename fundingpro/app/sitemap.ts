import type { MetadataRoute } from "next";
import { LEGAL_DOCUMENTS } from "@/lib/legal/meta";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/grants`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${appUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${appUrl}/stories`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/donors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${appUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const legalPages: MetadataRoute.Sitemap = LEGAL_DOCUMENTS.map((doc) => ({
    url: `${appUrl}${doc.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...legalPages];
}
