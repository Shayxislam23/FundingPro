/** Static catalog seed data for Convex seed script and mobile public-fallback.ts. */

/** Donors referenced in public success stories (ПРООН, ЕС, GIZ, World Bank). */
export const SEED_DONORS = [
  {
    key: "a1000001-0000-4000-8000-000000000001",
    name: "UNDP",
    nameRu: "ПРООН",
    shortName: "UNDP",
    country: "International",
    website: "https://www.undp.org",
    description: "Программа развития ООН",
  },
  {
    key: "a1000001-0000-4000-8000-000000000002",
    name: "European Union",
    nameRu: "Европейский Союз",
    shortName: "EU",
    country: "European Union",
    website: "https://europa.eu",
    description: "Грантовые программы ЕС для Центральной Азии",
  },
  {
    key: "a1000001-0000-4000-8000-000000000003",
    name: "GIZ",
    nameRu: "GIZ",
    shortName: "GIZ",
    country: "Germany",
    website: "https://www.giz.de",
    description: "Немецкое общество международного сотрудничества",
  },
  {
    key: "a1000001-0000-4000-8000-000000000004",
    name: "World Bank",
    nameRu: "Всемирный банк",
    shortName: "WB",
    country: "International",
    website: "https://www.worldbank.org",
    description: "Международные проекты развития",
  },
  {
    key: "a1000001-0000-4000-8000-000000000005",
    name: "Swiss Embassy",
    nameRu: "Посольство Швейцарии",
    shortName: "Swiss",
    country: "Switzerland",
    website: "https://www.eda.admin.ch",
    description: "Швейцарское сотрудничество в Узбекистане",
  },
  {
    key: "a1000001-0000-4000-8000-000000000006",
    name: "Norwegian Helsinki Committee",
    nameRu: "Норвежский Хельсинкский комитет",
    shortName: "NHC",
    country: "Norway",
    website: "https://nhc.no",
    description: "Поддержка гражданского общества и прав человека в Центральной Азии",
  },
  {
    key: "a1000001-0000-4000-8000-000000000007",
    name: "U.S. Embassy Tashkent",
    nameRu: "Посольство США в Ташкенте",
    shortName: "US Embassy",
    country: "USA",
    website: "https://uz.usembassy.gov",
    description: "Грантовые программы Посольства США в Узбекистане",
  },
  {
    key: "a1000001-0000-4000-8000-000000000008",
    name: "UNESCO",
    nameRu: "ЮНЕСКО",
    shortName: "UNESCO",
    country: "International",
    website: "https://www.unesco.org",
    description: "Программы ЮНЕСКО в области образования, науки, культуры и молодёжи",
  },
  {
    key: "a1000001-0000-4000-8000-000000000009",
    name: "EBRD",
    nameRu: "ЕБРР",
    shortName: "EBRD",
    country: "International",
    website: "https://www.ebrd.com",
    description: "Европейский банк реконструкции и развития — поддержка МСБ и предпринимателей в Узбекистане",
  },
  {
    key: "a1000001-0000-4000-8000-000000000010",
    name: "IT Park Uzbekistan",
    nameRu: "IT Park Узбекистан",
    shortName: "IT Park",
    country: "Uzbekistan",
    website: "https://it-park.uz",
    description: "Государственный оператор IT-экосистемы Узбекистана: IT Park Ventures и программы поддержки стартапов",
  },
] as const;

export const SEED_PLANS = [
  {
    slug: "plan-ngo-basic",
    name: "Basic",
    nameRu: "Молодёжь / Физлица Basic",
    targetType: "INDIVIDUAL",
    priceUsd: 30,
    priceUzs: 384000,
    features: ["Доступ к базе грантов, стипендий и конкурсов", "5 AI-проверок", "2 черновика заявок"],
  },
  {
    slug: "plan-ngo-pro",
    name: "Pro",
    nameRu: "Молодёжь / Физлица Pro",
    targetType: "INDIVIDUAL",
    priceUsd: 50,
    priceUzs: 640000,
    features: ["Безлимитные AI-проверки", "10 черновиков", "Хранилище документов"],
  },
  {
    slug: "plan-ngo-consulting",
    name: "Consulting",
    nameRu: "Консалтинг",
    targetType: "INDIVIDUAL",
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

export const SEED_SETTINGS = [
  { key: "paymentsIntegrationStatus", value: "pending", category: "integrations" },
  { key: "aiProviderStatus", value: "mock", category: "integrations" },
  { key: "paymentIntegrationStatus", value: "pending_integration", category: "integrations" },
  { key: "successFeePercent", value: "3", category: "billing" },
  {
    key: "appDisclaimer",
    value:
      "FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить заявку.",
    category: "legal",
  },
] as const;

export const SEED_ORGANIZATIONS = [
  {
    key: "d3000001-0000-4000-8000-000000000001",
    name: "ЭкоНКО Узбекистан",
    legalName: "ЭкоНКО Узбекистан ННО",
    type: "NGO",
    country: "Uzbekistan",
    city: "Ташкент",
    sector: "environment",
    isVerified: true,
  },
  {
    key: "d3000001-0000-4000-8000-000000000002",
    name: "АгроКонсалт ООО",
    legalName: "АгроКонсалт ООО",
    type: "BUSINESS",
    country: "Uzbekistan",
    city: "Самарканд",
    sector: "agriculture",
    isVerified: false,
  },
  {
    key: "d3000001-0000-4000-8000-000000000003",
    name: "Центр образования",
    legalName: "Центр инновационного образования",
    type: "ACADEMIC",
    country: "Uzbekistan",
    city: "Ташкент",
    sector: "education",
    isVerified: true,
  },
] as const;

export const SEED_CONSULTANTS = [
  {
    orgName: "Алексей Иванов",
    bio: "Специалист по международным грантам ПРООН и ЕС. Помогаю НКО и малым бизнесам в подготовке заявок.",
    specialties: ["EU grants", "UNDP grants"],
    country: "Узбекистан",
    rating: 4.9,
    reviewCount: 34,
  },
  {
    orgName: "Диана Рашидова",
    bio: "Опыт работы с GIZ более 8 лет. Специализация — сельское хозяйство и устойчивое развитие.",
    specialties: ["GIZ grants", "climate grants"],
    country: "Казахстан",
    rating: 4.8,
    reviewCount: 21,
  },
  {
    orgName: "Тимур Ахмедов",
    bio: "Финансовый консультант с опытом в проектах World Bank и ADB. Помогаю выстроить бюджетную структуру.",
    specialties: ["World Bank grants", "business grants"],
    country: "Узбекистан",
    rating: 4.7,
    reviewCount: 18,
  },
  {
    orgName: "Малика Карабаева",
    bio: "Эксперт по грантам для НКО и инициатив в области прав человека и гендерного равенства.",
    specialties: ["NGO grants", "gender grants"],
    country: "Кыргызстан",
    rating: 4.85,
    reviewCount: 27,
  },
  {
    orgName: "Сергей Петров",
    bio: "Консультант по грантам в сфере образования, науки и инноваций для университетов и школ.",
    specialties: ["education grants", "EU grants"],
    country: "Узбекистан",
    rating: 4.75,
    reviewCount: 15,
  },
] as const;

type GrantSeed = {
  key: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  donorKey: string;
  sectors: string[];
  countryScope: string[];
  applicantTypes: string[];
  amountMin: number;
  amountMax: number;
  deadline: string;
  sourceUrl: string;
  isFeatured: boolean;
};

/** Surface individual applicants first where eligible; keep pure Government-only mega-grants unchanged. */
function withIndividualsFirst(types: string[]): string[] {
  if (types.includes("Individual")) return types;
  if (types.length === 1 && types[0] === "Government") return types;
  return ["Individual", ...types];
}

const SEED_GRANTS_RAW: GrantSeed[] = [

  // ── Youth & individual-focused recurring programmes (real, verified sources;
  //    dates below are annual-cycle placeholders — refresh from sourceUrl each cycle) ──
  { key: "b2000001-0000-4000-8000-000000000031", title: "GEF Small Grants Programme (Uzbekistan)", titleRu: "Программа малых грантов ГЭФ (Узбекистан)", description: "Annual UNDP-implemented small grants for environmental action: biodiversity, land and water management, climate adaptation, sustainable agriculture. Grants generally up to USD 50,000 with co-financing.", descriptionRu: "Ежегодные малые гранты ПРООН/ГЭФ на экологические проекты: биоразнообразие, управление землёй и водой, адаптация к климату, устойчивое сельское хозяйство. Обычно до 50 000 USD с софинансированием.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["environment", "climate", "biodiversity", "agriculture"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO"], amountMin: 5000, amountMax: 50000, deadline: "2027-01-31", sourceUrl: "https://www.undp.org/uzbekistan/news/gef-small-grants-programme-sgp-uzbekistan", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000032", title: "NHC Small Grants Programme for Central Asia", titleRu: "Программа малых грантов НХК для Центральной Азии", description: "Norwegian Helsinki Committee small grants for NGOs, civil society groups, human rights defenders and journalists in Central Asia. Budgets from USD 500 up to USD 9,999.", descriptionRu: "Малые гранты Норвежского Хельсинкского комитета для НКО, гражданских инициатив, правозащитников и журналистов Центральной Азии. Бюджет от 500 до 9 999 USD.", donorKey: "a1000001-0000-4000-8000-000000000006", sectors: ["human_rights", "civil_society", "media"], countryScope: ["Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan"], applicantTypes: ["NGO", "Individual"], amountMin: 500, amountMax: 9999, deadline: "2026-12-31", sourceUrl: "https://nhc.no/en/norwegian-helsinki-committee-small-grants-program-for-central-asia/", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000033", title: "U.S. Embassy Tashkent Small Grants Program", titleRu: "Программа малых грантов Посольства США", description: "Grant programs of the U.S. Embassy in Uzbekistan supporting civil society, media, education and community initiatives. Calls are published on the embassy grants page.", descriptionRu: "Грантовые программы Посольства США в Узбекистане: гражданское общество, СМИ, образование и общественные инициативы. Конкурсы публикуются на странице грантов посольства.", donorKey: "a1000001-0000-4000-8000-000000000007", sectors: ["civil_society", "media", "education"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Individual", "Academic"], amountMin: 5000, amountMax: 100000, deadline: "2026-12-31", sourceUrl: "https://uz.usembassy.gov/grants/", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000034", title: "Alumni Engagement Innovation Fund (AEIF)", titleRu: "Фонд инноваций выпускников (AEIF)", description: "Annual U.S. Department of State competition for alumni of U.S. government exchange programs: community projects on education, inclusion, women's economic empowerment and youth.", descriptionRu: "Ежегодный конкурс Госдепартамента США для выпускников обменных программ: общественные проекты по образованию, инклюзии, экономическим возможностям женщин и молодёжи.", donorKey: "a1000001-0000-4000-8000-000000000007", sectors: ["education", "youth", "gender"], countryScope: ["Uzbekistan"], applicantTypes: ["Individual", "NGO"], amountMin: 5000, amountMax: 24000, deadline: "2027-02-28", sourceUrl: "https://uz.usembassy.gov/education-culture/study-usa/alumni/notice-of-funding-opportunity/", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000035", title: "UNESCO Global Youth Grant Scheme", titleRu: "Глобальная молодёжная грантовая схема ЮНЕСКО", description: "UNESCO scheme supporting youth-led actions and research worldwide, building capacities of young people and youth organizations.", descriptionRu: "Схема ЮНЕСКО в поддержку молодёжных инициатив и исследований по всему миру, развитие потенциала молодёжи и молодёжных организаций.", donorKey: "a1000001-0000-4000-8000-000000000008", sectors: ["youth", "education", "research"], countryScope: ["Uzbekistan", "International"], applicantTypes: ["Individual", "NGO"], amountMin: 3000, amountMax: 30000, deadline: "2027-03-31", sourceUrl: "https://www.unesco.org/en/youth/global-grant-scheme", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000036", title: "EU Calls for Proposals — Civil Society Uzbekistan", titleRu: "Конкурсы ЕС для гражданского общества Узбекистана", description: "Recurring EU Delegation calls supporting civil society organizations in Uzbekistan: inclusive development, gender equality, Green Agenda. Current calls are published on the EU Funding & Tenders portal.", descriptionRu: "Регулярные конкурсы Представительства ЕС для организаций гражданского общества Узбекистана: инклюзивное развитие, гендерное равенство, «зелёная» повестка. Актуальные конкурсы — на портале EU Funding & Tenders.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["civil_society", "gender", "climate"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO"], amountMin: 20000, amountMax: 200000, deadline: "2027-01-31", sourceUrl: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000037", title: "Erasmus+ Capacity Building in Higher Education (CBHE)", titleRu: "Erasmus+ Развитие потенциала высшего образования (CBHE)", description: "Annual EU calls for higher education institutions in Central Asia (Region 6): modernization of universities, Green Deal, digital transformation, sustainable growth. Uzbekistan HEIs apply in consortia with EU universities; current calls via the National Erasmus+ Office and the EU Funding & Tenders portal.", descriptionRu: "Ежегодные конкурсы ЕС для вузов Центральной Азии (Регион 6): модернизация университетов, «зелёная» повестка, цифровая трансформация. Вузы Узбекистана участвуют в консорциумах с университетами ЕС; актуальные конкурсы — через Национальный офис Erasmus+ и портал EU Funding & Tenders.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["education", "research"], countryScope: ["Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan"], applicantTypes: ["Academic"], amountMin: 50000, amountMax: 1000000, deadline: "2027-02-28", sourceUrl: "https://erasmus-plus.ec.europa.eu/programme-guide/part-b/key-action-2/capacity-building-higher-education", isFeatured: false },

  // ── Business & entrepreneurship programmes (real, verified sources) ────────
  { key: "b2000001-0000-4000-8000-000000000038", title: "IT Park Ventures — Seed to Series A Investment", titleRu: "IT Park Ventures — инвестиции от идеи до Series A", description: "$30M venture fund investing $10,000-$1,000,000 in Uzbekistan and Central Asian tech startups (AI/ML, GreenTech, EdTech, FinTech, GameDev), plus mentorship and government co-financing.", descriptionRu: "Венчурный фонд на $30 млн: инвестиции от $10 000 до $1 000 000 в технологические стартапы Узбекистана и Центральной Азии (AI/ML, GreenTech, EdTech, FinTech, GameDev), менторская поддержка и государственное софинансирование.", donorKey: "a1000001-0000-4000-8000-000000000010", sectors: ["technology", "business", "innovation"], countryScope: ["Uzbekistan"], applicantTypes: ["Business"], amountMin: 10000, amountMax: 1000000, deadline: "2027-12-31", sourceUrl: "https://itparkventures.uz/en", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000039", title: "IT Park Digital Startups Program", titleRu: "IT Park — Программа поддержки цифровых стартапов", description: "State program matching foreign investment raised by startups up to $100,000, partial reimbursement of acceleration/incubation costs, and collateral-free loans up to 300M UZS.", descriptionRu: "Госпрограмма: удвоение привлечённых стартапом иностранных инвестиций до $100 000, частичная компенсация расходов на акселерацию/инкубацию, льготные займы без залога до 300 млн сум.", donorKey: "a1000001-0000-4000-8000-000000000010", sectors: ["technology", "business"], countryScope: ["Uzbekistan"], applicantTypes: ["Business"], amountMin: 5000, amountMax: 100000, deadline: "2027-12-31", sourceUrl: "https://it-park.uz/en/itpark/news/presentation-of-the-digital-startups-program-support-for-startups", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000040", title: "EBRD Youth in Business Programme (Central Asia)", titleRu: "Программа ЕБРР «Молодёжь в бизнесе» (Центральная Азия)", description: "EBRD credit line and advisory for micro, small and medium enterprises led by entrepreneurs under 35, delivered through partner banks in Uzbekistan.", descriptionRu: "Кредитная линия и консультационная поддержка ЕБРР для микро-, малого и среднего бизнеса, которым руководят предприниматели до 35 лет, через банки-партнёры в Узбекистане.", donorKey: "a1000001-0000-4000-8000-000000000009", sectors: ["business", "finance"], countryScope: ["Uzbekistan"], applicantTypes: ["Business", "Individual"], amountMin: 5000, amountMax: 250000, deadline: "2027-12-31", sourceUrl: "https://www.ebrd.com/home/news-and-events/news/2024/ebrd-offers-support-to-young-entrepreneurs-and-smes-in-uzbekistan.html", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000041", title: "EBRD Advice for Small Businesses", titleRu: "ЕБРР — консультации для малого бизнеса", description: "Free and subsidized business advisory, training and networking for eligible SMEs to improve performance and access finance.", descriptionRu: "Бесплатные и субсидируемые консультации, обучение и networking для МСБ — повышение эффективности бизнеса и доступ к финансированию.", donorKey: "a1000001-0000-4000-8000-000000000009", sectors: ["business"], countryScope: ["Uzbekistan"], applicantTypes: ["Business"], amountMin: 1000, amountMax: 20000, deadline: "2027-12-31", sourceUrl: "https://www.ebrd.com/home/what-we-do/products-and-services/support-for-start-ups-and-msmes/access-business-advice.html", isFeatured: false },
];

export const SEED_GRANTS: GrantSeed[] = SEED_GRANTS_RAW.map((grant) => ({
  ...grant,
  applicantTypes: withIndividualsFirst(grant.applicantTypes),
}));

type GrantRequirementSeed = {
  grantKey: string;
  requirementType: string;
  text: string;
  required: boolean;
};

/**
 * Requirements for the seeded programmes. Left empty on purpose: add an entry only
 * after checking it against the programme's sourceUrl, never from memory.
 */
export const SEED_GRANT_REQUIREMENTS: GrantRequirementSeed[] = [];

export function parseDeadline(dateStr: string): number {
  return new Date(`${dateStr}T23:59:59.000Z`).getTime();
}
