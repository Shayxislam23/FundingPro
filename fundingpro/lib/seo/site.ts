import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.fundingpro.uz";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FundingPro";

/** Default social preview image (1200×630). Served by app/opengraph-image.tsx. */
export const defaultOgImagePath = "/opengraph-image";

export const siteConfig = {
  name: appName,
  url: appUrl,
  locale: "ru_RU",
  description:
    "FundingPro помогает бизнесу и молодёжи находить гранты, стипендии и программы, проверять соответствие требованиям донора и готовить заявки с помощью AI.",
  ogDescription:
    "AI-платформа для бизнеса и молодёжи: поиск грантов и стипендий, проверка соответствия и подготовка заявок в Узбекистане и Центральной Азии.",
  twitterDescription:
    "Гранты и стипендии для бизнеса и молодёжи: AI-подбор, проверка соответствия и черновики заявок.",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

export const defaultOgImageUrl = absoluteUrl(defaultOgImagePath);

export function defaultOgImages(): NonNullable<Metadata["openGraph"]>["images"] {
  return [
    {
      url: defaultOgImageUrl,
      width: 1200,
      height: 630,
      alt: siteConfig.name,
    },
  ];
}

/** Minimal ru/uz hreflang stubs for public pages (Uzbek UI planned). */
export function hreflangAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const uzPath =
    path === "/"
      ? "/?lang=uz"
      : `${path}${path.includes("?") ? "&" : "?"}lang=uz`;

  return {
    canonical: path,
    languages: {
      ru: path,
      uz: uzPath,
    },
  };
}

export function openGraphPage(
  title: string,
  description: string,
  path: string
): NonNullable<Metadata["openGraph"]> {
  return {
    title,
    description,
    url: absoluteUrl(path),
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    images: defaultOgImages(),
  };
}
