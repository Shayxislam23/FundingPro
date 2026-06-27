import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, openGraphPage, siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — AI-платформа для грантов`,
  description: siteConfig.description,
  openGraph: openGraphPage(
    `${siteConfig.name} — AI-платформа для грантов`,
    siteConfig.ogDescription,
    "/"
  ),
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — AI-платформа для грантов`,
    description: siteConfig.twitterDescription,
  },
  alternates: {
    canonical: "/",
    languages: {
      ru: "/",
      uz: "/?lang=uz",
    },
  },
};

export default function LandingPage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "ru",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/grants")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      <LandingPageClient />
    </>
  );
}
