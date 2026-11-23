import type { ReactNode } from "react";
import { Suspense } from "react";
import { LoadingState } from "@/components/design/LoadingState";

export default function ZoomradLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="FundingPro Mini App…" />}>{children}</Suspense>
  );
}
