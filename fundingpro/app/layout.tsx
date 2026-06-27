import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ConvexClerkProvider } from "@/components/providers/ConvexClerkProvider";
import { defaultOgImageUrl, defaultOgImages, hreflangAlternates, siteConfig } from "@/lib/seo/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — AI-платформа для грантов`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: hreflangAlternates("/"),
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — AI-платформа для грантов`,
    description: siteConfig.ogDescription,
    images: defaultOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — AI-платформа для грантов`,
    description: siteConfig.twitterDescription,
    images: [defaultOgImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
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
