import { Suspense } from "react";

export default function LegalRootLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-funding-light-bg" />}>{children}</Suspense>;
}
