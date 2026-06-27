const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.fundingpro.uz";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FundingPro";

export const siteConfig = {
  name: appName,
  url: appUrl,
  locale: "ru_RU",
  description:
    "FundingPro помогает организациям и предпринимателям находить гранты, проверять соответствие требованиям донора и готовить заявки с помощью AI.",
  ogDescription:
    "Поиск международных грантов, AI-проверка соответствия и подготовка заявок для Узбекистана и Центральной Азии.",
  twitterDescription:
    "Поиск международных грантов, AI-проверка соответствия и подготовка заявок.",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

export function openGraphPage(
  title: string,
  description: string,
  path: string
): {
  title: string;
  description: string;
  url: string;
  type: "website";
  locale: string;
  siteName: string;
} {
  return {
    title,
    description,
    url: absoluteUrl(path),
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  };
}
