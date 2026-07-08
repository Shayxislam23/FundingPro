import { Suspense, type ReactNode } from "react";

export default function LegalRootLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-funding-light-bg" />}>{children}</Suspense>;
}
