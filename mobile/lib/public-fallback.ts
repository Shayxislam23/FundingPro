import type {
  DonorsListResult,
  GrantDetail,
  GrantListItem,
  ListGrantsResult,
  Plan,
  PublicDonor,
} from "@fundingpro/api-types";

/** Mirrors convex/seedData.ts SEED_PLANS — keep in sync when seed catalog changes. */
const FALLBACK_PLAN_SEED = [
  {
    slug: "plan-ngo-basic",
    name: "Basic",
    nameRu: "Basic — физлица",
    targetType: "INDIVIDUAL",
    priceUsd: 30,
    priceUzs: 384000,
    features: ["Доступ к базе грантов", "5 AI-проверок", "2 черновика заявок"],
  },
  {
    slug: "plan-ngo-pro",
    name: "Pro",
    nameRu: "Pro — физлица",
    targetType: "INDIVIDUAL",
    priceUsd: 50,
    priceUzs: 640000,
    features: ["Безлимитные AI-проверки", "10 черновиков", "Хранилище документов"],
  },
  {
    slug: "plan-ngo-consulting",
    name: "Consulting",
    nameRu: "Консалтинг",
    targetType: "NGO",
    priceUsd: 100,
    priceUzs: 1280000,
    features: ["Персональный консультант", "Pre-application review"],
  },
  {
    slug: "plan-business-starter",
    name: "Starter",
    nameRu: "Бизнес Starter",
    targetType: "BUSINESS",
    priceUsd: 90,
    priceUzs: 1152000,
    features: ["Корпоративный профиль", "До 3 пользователей"],
  },
  {
    slug: "plan-business-pro",
    name: "Pro",
    nameRu: "Бизнес Pro",
    targetType: "BUSINESS",
    priceUsd: 200,
    priceUzs: 2560000,
    features: ["До 10 пользователей", "5 часов консультаций"],
  },
  {
    slug: "plan-enterprise",
    name: "Enterprise",
    nameRu: "Enterprise",
    targetType: "ENTERPRISE",
    priceUsd: 500,
    priceUzs: 6400000,
    features: ["Индивидуальные условия", "Выделенный менеджер"],
  },
] as const;

// Highlights the individuals-first Pro plan and business Pro plan.
// "plan-ngo-pro" slug is legacy; targetType is INDIVIDUAL ("Pro — физлица").
const HIGHLIGHTED_PLAN_SLUGS = new Set(["plan-ngo-pro", "plan-business-pro"]);

const FALLBACK_USD_UZS_RATE = 12800;

const FALLBACK_PLANS: Plan[] = FALLBACK_PLAN_SEED.map((plan) => ({
  id: plan.slug,
  name: plan.name,
  nameRu: plan.nameRu,
  targetType: plan.targetType,
  priceUsd: plan.priceUsd,
  priceUzs: plan.priceUzs,
  features: [...plan.features],
  highlighted: HIGHLIGHTED_PLAN_SLUGS.has(plan.slug),
}));

function groupFallbackPlans(plans: Plan[]) {
  return {
    individual: plans.filter((p) => p.targetType === "INDIVIDUAL"),
    ngo: plans.filter((p) => p.targetType === "NGO"),
    business: plans.filter(
      (p) => p.targetType === "BUSINESS" || p.targetType === "ENTERPRISE"
    ),
  };
}

export type PlansListResult = {
  plans: Plan[];
  grouped: Record<string, Plan[]>;
  total: number;
  usdUzsRate: number;
};

/**
 * Static demo catalog used only when the public API returns empty lists.
 * Mirrors convex/seedData.ts featured entries aligned with success stories.
 */
const FALLBACK_DONORS: PublicDonor[] = [
  {
    id: "fallback-donor-undp",
    name: "UNDP",
    name_ru: "ПРООН",
    description: "Программа развития ООН",
    country: "International",
    website: "https://www.undp.org",
  },
  {
    id: "fallback-donor-eu",
    name: "European Union",
    name_ru: "Европейский Союз",
    description: "Грантовые программы ЕС для Центральной Азии",
    country: "European Union",
    website: "https://europa.eu",
  },
  {
    id: "fallback-donor-giz",
    name: "GIZ",
    name_ru: "GIZ",
    description: "Немецкое общество международного сотрудничества",
    country: "Germany",
    website: "https://www.giz.de",
  },
  {
    id: "fallback-donor-wb",
    name: "World Bank",
    name_ru: "Всемирный банк",
    description: "Международные проекты развития",
    country: "International",
    website: "https://www.worldbank.org",
  },
  {
    id: "fallback-donor-swiss",
    name: "Swiss Embassy",
    name_ru: "Посольство Швейцарии",
    description: "Швейцарское сотрудничество в Узбекистане",
    country: "Switzerland",
    website: "https://www.eda.admin.ch",
  },
];

/** Three featured grants from seed — UNDP, GIZ, World Bank match pilot success stories. */
const FALLBACK_GRANTS: GrantListItem[] = [
  {
    id: "fallback-grant-climate",
    title: "Climate Resilience for Central Asia",
    title_ru: "Устойчивость к изменению климата в Центральной Азии",
    description: "Поддержка проектов адаптации к изменению климата в регионе ЦА.",
    sectors: ["climate", "environment"],
    country_scope: ["Uzbekistan", "Kazakhstan", "Kyrgyzstan"],
    amount_min: 50000,
    amount_max: 250000,
    deadline: "2026-09-30T23:59:59.000Z",
    donor: {
      id: "fallback-donor-undp",
      name: "UNDP",
      name_ru: "ПРООН",
    },
  },
  {
    id: "fallback-grant-green-economy",
    title: "GIZ Green Economy Initiative",
    title_ru: "Инициатива GIZ по зелёной экономике",
    description: "Устойчивое сельское хозяйство и развитие зелёного бизнеса.",
    sectors: ["agriculture", "economy"],
    country_scope: ["Uzbekistan", "Tajikistan"],
    amount_min: 40000,
    amount_max: 200000,
    deadline: "2026-10-01T23:59:59.000Z",
    donor: {
      id: "fallback-donor-giz",
      name: "GIZ",
      name_ru: "GIZ",
    },
  },
  {
    id: "fallback-grant-education",
    title: "World Bank Education Modernization",
    title_ru: "Модернизация образования — Всемирный банк",
    description: "Цифровая трансформация школ и университетов.",
    sectors: ["education", "technology"],
    country_scope: ["Uzbekistan"],
    amount_min: 100000,
    amount_max: 500000,
    deadline: "2026-11-30T23:59:59.000Z",
    donor: {
      id: "fallback-donor-wb",
      name: "World Bank",
      name_ru: "Всемирный банк",
    },
  },
];

export type PublicListFallback<T> = T & { fromFallback: boolean };

export function withGrantsFallback(
  data: ListGrantsResult | undefined
): PublicListFallback<ListGrantsResult> {
  if (data && data.grants.length > 0) {
    return { ...data, fromFallback: false };
  }

  const grants = FALLBACK_GRANTS;
  return {
    grants,
    total: grants.length,
    page: 1,
    limit: grants.length,
    pages: 1,
    fromFallback: true,
  };
}

export function withDonorsFallback(
  data: DonorsListResult | undefined
): PublicListFallback<DonorsListResult> {
  if (data && data.donors.length > 0) {
    return { ...data, fromFallback: false };
  }

  const donors = FALLBACK_DONORS;
  return {
    donors,
    total: donors.length,
    fromFallback: true,
  };
}

export function withPlansFallback(
  data: PlansListResult | undefined
): PublicListFallback<PlansListResult> {
  if (data && data.plans.length > 0) {
    return { ...data, fromFallback: false };
  }

  const plans = FALLBACK_PLANS;
  return {
    plans,
    grouped: groupFallbackPlans(plans),
    total: plans.length,
    usdUzsRate: FALLBACK_USD_UZS_RATE,
    fromFallback: true,
  };
}

export function getFallbackGrants(): GrantListItem[] {
  return FALLBACK_GRANTS;
}

/** Full seed catalog size — shown on landing when API returns empty totals. */
export const FALLBACK_LANDING_GRANT_TOTAL = 30;

export function getLandingGrantStats(apiTotal: number): { value: string; label: string; fromFallback: boolean } {
  if (apiTotal > 0) {
    return { value: `${apiTotal}+`, label: "грантов в каталоге", fromFallback: false };
  }
  return { value: `${FALLBACK_LANDING_GRANT_TOTAL}+`, label: "грантов", fromFallback: true };
}

export function getLandingDonorStats(apiTotal: number): { value: string; label: string; fromFallback: boolean } {
  if (apiTotal > 0) {
    return { value: String(apiTotal), label: "доноров", fromFallback: false };
  }
  return { value: String(FALLBACK_DONORS.length), label: "доноров", fromFallback: true };
}

const FALLBACK_GRANT_IDS = new Set(FALLBACK_GRANTS.map((grant) => grant.id));

export function isFallbackGrantId(id: string): boolean {
  return FALLBACK_GRANT_IDS.has(id);
}

export function getFallbackGrantDetail(id: string): GrantDetail | null {
  const grant = FALLBACK_GRANTS.find((item) => item.id === id);
  if (!grant) return null;

  const donor = FALLBACK_DONORS.find((item) => item.id === grant.donor.id);
  return {
    ...grant,
    description_ru:
      grant.id === "fallback-grant-climate"
        ? "Поддержка проектов адаптации к изменению климата в регионе ЦА."
        : grant.id === "fallback-grant-green-economy"
          ? "Устойчивое сельское хозяйство и развитие зелёного бизнеса."
          : grant.id === "fallback-grant-education"
            ? "Цифровая трансформация школ и университетов."
            : null,
    grant_requirements: [],
    donor: {
      ...grant.donor,
      website: donor?.website ?? null,
    },
  };
}
