import type { Metadata } from "next";
import localFont from "next/font/local";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ConvexClerkProvider } from "@/components/providers/ConvexClerkProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FundingPro";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — AI-платформа для грантов`,
    template: `%s | ${appName}`,
  },
  description:
    "FundingPro помогает организациям и предпринимателям находить гранты, проверять соответствие требованиям донора и готовить заявки с помощью AI.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: appUrl,
    siteName: appName,
    title: `${appName} — AI-платформа для грантов`,
    description:
      "Поиск международных грантов, AI-проверка соответствия и подготовка заявок для Узбекистана и Центральной Азии.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — AI-платформа для грантов`,
    description:
      "Поиск международных грантов, AI-проверка соответствия и подготовка заявок.",
  },
  alternates: {
    canonical: "/",
    languages: {
      ru: "/",
      uz: "/?lang=uz",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClerkProvider>
          <AnalyticsProvider />
          {children}
        </ConvexClerkProvider>
      </body>
    </html>
  );
}
