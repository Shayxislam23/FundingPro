/** Sample grant detail payload aligned with convex/grants.getById and seedData. */
export const GRANT_DETAIL_FIXTURE = {
  id: "b2000001-0000-4000-8000-000000000001",
  title: "Climate Resilience for Central Asia",
  title_ru: "Устойчивость к изменению климата в Центральной Азии",
  description: "Support for climate adaptation projects in CA region.",
  description_ru: "Поддержка проектов адаптации к изменению климата в регионе ЦА.",
  sectors: ["climate", "environment"],
  country_scope: ["Uzbekistan", "Kazakhstan", "Kyrgyzstan"],
  amount_min: 50000,
  amount_max: 250000,
  deadline: "2026-09-30T23:59:59.000Z",
  donor: {
    id: "a1000001-0000-4000-8000-000000000001",
    name: "UNDP",
    name_ru: "ПРООН",
    website: "https://undp.org",
  },
  grant_requirements: [
    {
      id: "req-1",
      requirement_type: "org_type",
      text: "Зарегистрированная НКО или государственная организация",
      required: true,
    },
  ],
} as const;

export const PLANS_FIXTURE = {
  plans: [
    {
      id: "plan-ngo-basic",
      name: "NGO Basic",
      nameRu: "НКО Базовый",
      targetType: "ngo",
      priceUsd: 19,
      priceUzs: 245000,
      features: ["Eligibility checks", "Grant matching"],
      highlighted: false,
    },
  ],
  grouped: {
    ngo: [
      {
        id: "plan-ngo-basic",
        name: "NGO Basic",
        nameRu: "НКО Базовый",
        targetType: "ngo",
        priceUsd: 19,
        priceUzs: 245000,
        features: ["Eligibility checks", "Grant matching"],
        highlighted: false,
      },
    ],
  },
  total: 1,
  usdUzsRate: 12900,
} as const;

export const PAYMENTS_STATUS_FIXTURE = {
  paymentsEnabled: true,
  integrationStatus: "configured",
  provider: "uzum",
  providers: [
    {
      id: "uzum",
      enabled: true,
      configured: true,
      label: "Uzum",
      methods: ["checkout"],
    },
  ],
} as const;
