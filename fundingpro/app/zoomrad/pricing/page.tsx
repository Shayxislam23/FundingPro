import { ZoomradPricingClient } from "@/components/partners/ZoomradPricingClient";
import { listPlans } from "@/lib/db/plans";
import { formatPlanPriceDisplay } from "@/lib/format-plan";

type PageProps = {
  searchParams: Promise<{ channel?: string; lang?: string }>;
};

export default async function ZoomradPricingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  let plans: Awaited<ReturnType<typeof listPlans>> = [];
  try {
    plans = await listPlans();
  } catch {
    plans = [];
  }

  const priced = plans.map((plan) => ({
    ...plan,
    priceLabel: formatPlanPriceDisplay(plan.priceUzs, plan.priceUsd).primary,
  }));

  return <ZoomradPricingClient plans={priced} searchParams={sp} />;
}
