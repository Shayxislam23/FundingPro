import { formatPlanPriceDisplay } from "@/lib/format-plan";

export type Plan = {
  id: string;
  name: string;
  nameRu: string;
  pricePrimary: string;
  priceSecondary: string;
  period: string;
  highlighted?: boolean;
  features: string[];
};

export type PaymentConfig = {
  paymentsEnabled: boolean;
  integrationStatus: string;
  message: string;
  merchantConfigured: boolean;
  checkoutConfigured: boolean;
  providers?: {
    id: "uzum" | "payme" | "click";
    enabled: boolean;
    configured: boolean;
    label: string;
    methods: string[];
  }[];
};

export function mapApiPlan(row: {
  id: string;
  name: string;
  nameRu: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
}): Plan {
  const display = formatPlanPriceDisplay(row.priceUzs, row.priceUsd);
  return {
    id: row.id,
    name: row.name,
    nameRu: row.nameRu,
    pricePrimary: display.primary,
    priceSecondary: display.secondary,
    period: "/мес",
    highlighted: row.highlighted,
    features: row.features,
  };
}

export type PaymentProvider = NonNullable<PaymentConfig["providers"]>[number];
