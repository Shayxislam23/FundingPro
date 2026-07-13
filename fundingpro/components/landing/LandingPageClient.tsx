"use client";

import { useEffect, useState } from "react";
import { captureUtmParams } from "@/lib/analytics";
import { LandingHeroSection } from "./LandingHeroSection";
import { LandingHowItWorksSection } from "./LandingHowItWorksSection";
import { LandingTrustStripSection } from "./LandingTrustStripSection";
import { LandingAboutSection } from "./LandingAboutSection";
import { LandingFeaturesSection } from "./LandingFeaturesSection";
import { LandingPricingSection } from "./LandingPricingSection";
import { LandingCtaSection } from "./LandingCtaSection";
import {
  FEATURED_PLAN_IDS,
  formatGrantCountLabel,
  type LandingPlan,
} from "./landingConstants";

export function LandingPageClient() {
  const [grantTotal, setGrantTotal] = useState<number | null>(null);
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [usdUzsRate, setUsdUzsRate] = useState<number | null>(null);

  useEffect(() => {
    captureUtmParams();
  }, []);

  useEffect(() => {
    fetch("/api/v1/grants?limit=1")
      .then((r) => r.json())
      .then((d) => setGrantTotal(d.data?.total ?? null))
      .catch(() => setGrantTotal(null));
  }, []);

  useEffect(() => {
    fetch("/api/v1/plans")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.data?.plans ?? []) as LandingPlan[];
        const individual =
          ((d.data?.grouped?.individual ?? []) as LandingPlan[]).length > 0
            ? (d.data.grouped.individual as LandingPlan[])
            : all.filter((p) => {
                const t = String((p as LandingPlan & { targetType?: string }).targetType ?? "")
                  .trim()
                  .toUpperCase();
                return t === "INDIVIDUAL" || FEATURED_PLAN_IDS.includes(p.id);
              });
        const featured = FEATURED_PLAN_IDS.map((id) => individual.find((p) => p.id === id)).filter(
          (p): p is LandingPlan => Boolean(p)
        );
        setPlans(featured.length > 0 ? featured : individual.slice(0, 3));
        if (d.data?.usdUzsRate) setUsdUzsRate(Number(d.data.usdUzsRate));
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const grantCountLabel = formatGrantCountLabel(grantTotal);

  return (
    <div className="min-h-screen bg-funding-dark text-white overflow-hidden">
      <LandingHeroSection grantCountLabel={grantCountLabel} />
      <LandingHowItWorksSection />
      <LandingTrustStripSection grantCountLabel={grantCountLabel} />
      <LandingAboutSection grantCountLabel={grantCountLabel} />
      <LandingFeaturesSection />
      <LandingPricingSection plans={plans} plansLoading={plansLoading} usdUzsRate={usdUzsRate} />
      <LandingCtaSection />
    </div>
  );
}
