import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FundingPro — ZOOMRAD Mini App",
  description: "AI-платформа для грантов в ZOOMRAD",
};

export default function ZoomradLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-funding-dark flex items-start justify-center">
      {children}
    </div>
  );
}
