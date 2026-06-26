/** Static catalog seed data for Convex seed script. */

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
] as const;

export const SEED_PLANS = [
  {
    slug: "plan-ngo-basic",
    name: "Basic",
    nameRu: "НКО / Физлица Basic",
    targetType: "NGO",
    priceUsd: 30,
    priceUzs: 384000,
    features: ["Доступ к базе грантов", "5 AI-проверок", "2 черновика заявок"],
  },
  {
    slug: "plan-ngo-pro",
    name: "Pro",
    nameRu: "НКО / Физлица Pro",
    targetType: "NGO",
    priceUsd: 50,
    priceUzs: 640000,
    features: ["Безлимитные AI-проверки", "10 черновиков", "Хранилище документов"],
  },
  {
    slug: "plan-consulting",
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

export const SEED_SETTINGS = [
  { key: "paymentsIntegrationStatus", value: "pending", category: "integrations" },
  { key: "aiProviderStatus", value: "mock", category: "integrations" },
  { key: "paymentIntegrationStatus", value: "pending_integration", category: "integrations" },
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

export const SEED_GRANTS: GrantSeed[] = [
  { key: "b2000001-0000-4000-8000-000000000001", title: "Climate Resilience for Central Asia", titleRu: "Устойчивость к изменению климата в Центральной Азии", description: "Support for climate adaptation projects in CA region.", descriptionRu: "Поддержка проектов адаптации к изменению климата в регионе ЦА.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["climate", "environment"], countryScope: ["Uzbekistan", "Kazakhstan", "Kyrgyzstan"], applicantTypes: ["NGO", "Government"], amountMin: 50000, amountMax: 250000, deadline: "2026-09-30", sourceUrl: "https://undp.org/grants/climate-ca", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000002", title: "EU Civil Society Support Programme", titleRu: "Программа поддержки гражданского общества ЕС", description: "Strengthening civil society organizations in Uzbekistan.", descriptionRu: "Укрепление организаций гражданского общества в Узбекистане.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["civil_society", "human_rights"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO"], amountMin: 30000, amountMax: 150000, deadline: "2026-08-15", sourceUrl: "https://europa.eu/grants/cso-uz", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000003", title: "GIZ Green Economy Initiative", titleRu: "Инициатива GIZ по зелёной экономике", description: "Sustainable agriculture and green business development.", descriptionRu: "Устойчивое сельское хозяйство и развитие зелёного бизнеса.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["agriculture", "economy"], countryScope: ["Uzbekistan", "Tajikistan"], applicantTypes: ["NGO", "Business"], amountMin: 40000, amountMax: 200000, deadline: "2026-10-01", sourceUrl: "https://giz.de/grants/green-economy", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000004", title: "World Bank Education Modernization", titleRu: "Модернизация образования — Всемирный банк", description: "Digital transformation of schools and universities.", descriptionRu: "Цифровая трансформация школ и университетов.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["education", "technology"], countryScope: ["Uzbekistan"], applicantTypes: ["Government", "Academic"], amountMin: 100000, amountMax: 500000, deadline: "2026-11-30", sourceUrl: "https://worldbank.org/education-uz", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000005", title: "Swiss Water Management Fund", titleRu: "Швейцарский фонд управления водными ресурсами", description: "Water conservation and irrigation efficiency projects.", descriptionRu: "Проекты по сохранению воды и эффективности орошения.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["water", "environment"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Government"], amountMin: 25000, amountMax: 120000, deadline: "2026-07-20", sourceUrl: "https://eda.admin.ch/water-uz", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000006", title: "UNDP Youth Employment Programme", titleRu: "Программа занятости молодёжи ПРООН", description: "Skills training and entrepreneurship for youth.", descriptionRu: "Обучение навыкам и предпринимательство для молодёжи.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["youth", "economy"], countryScope: ["Uzbekistan", "Kyrgyzstan"], applicantTypes: ["NGO", "Business"], amountMin: 20000, amountMax: 100000, deadline: "2026-08-30", sourceUrl: "https://undp.org/youth-employment", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000007", title: "EU Gender Equality Grants", titleRu: "Гранты ЕС на гендерное равенство", description: "Projects promoting women empowerment and gender equality.", descriptionRu: "Проекты по расширению прав женщин и гендерному равенству.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["gender", "human_rights"], countryScope: ["Uzbekistan", "Tajikistan"], applicantTypes: ["NGO"], amountMin: 35000, amountMax: 175000, deadline: "2026-09-15", sourceUrl: "https://europa.eu/gender-ca", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000008", title: "GIZ Healthcare Access", titleRu: "Доступ к здравоохранению — GIZ", description: "Improving primary healthcare in rural areas.", descriptionRu: "Улучшение первичной медицинской помощи в сельских районах.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["healthcare"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Government"], amountMin: 45000, amountMax: 180000, deadline: "2026-10-15", sourceUrl: "https://giz.de/healthcare", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000009", title: "World Bank SME Development", titleRu: "Развитие МСП — Всемирный банк", description: "Support for small and medium enterprises.", descriptionRu: "Поддержка малых и средних предприятий.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["economy", "business"], countryScope: ["Uzbekistan", "Kazakhstan"], applicantTypes: ["Business"], amountMin: 75000, amountMax: 300000, deadline: "2026-12-01", sourceUrl: "https://worldbank.org/sme", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000010", title: "Swiss Cultural Heritage Fund", titleRu: "Швейцарский фонд культурного наследия", description: "Preservation of cultural heritage sites.", descriptionRu: "Сохранение объектов культурного наследия.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["culture", "heritage"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Government"], amountMin: 15000, amountMax: 80000, deadline: "2026-06-30", sourceUrl: "https://eda.admin.ch/heritage", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000011", title: "UNDP Digital Governance", titleRu: "Цифровое управление — ПРООН", description: "E-government and digital public services.", descriptionRu: "Электронное правительство и цифровые госуслуги.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["technology", "governance"], countryScope: ["Uzbekistan"], applicantTypes: ["Government"], amountMin: 60000, amountMax: 250000, deadline: "2026-11-15", sourceUrl: "https://undp.org/digital-gov", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000012", title: "EU Renewable Energy Fund", titleRu: "Фонд возобновляемой энергии ЕС", description: "Solar and wind energy projects in Central Asia.", descriptionRu: "Проекты солнечной и ветровой энергии в ЦА.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["energy", "climate"], countryScope: ["Uzbekistan", "Kazakhstan"], applicantTypes: ["Business", "NGO"], amountMin: 80000, amountMax: 400000, deadline: "2026-10-30", sourceUrl: "https://europa.eu/renewable", isFeatured: true },
  { key: "b2000001-0000-4000-8000-000000000013", title: "GIZ Vocational Training", titleRu: "Профессиональное обучение — GIZ", description: "Vocational education and workforce development.", descriptionRu: "Профессиональное образование и развитие кадров.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["education", "youth"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Academic"], amountMin: 30000, amountMax: 150000, deadline: "2026-08-01", sourceUrl: "https://giz.de/vocational", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000014", title: "World Bank Water Infrastructure", titleRu: "Водная инфраструктура — Всемирный банк", description: "Rural water supply and sanitation projects.", descriptionRu: "Сельское водоснабжение и санитария.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["water", "infrastructure"], countryScope: ["Uzbekistan", "Tajikistan"], applicantTypes: ["Government"], amountMin: 150000, amountMax: 600000, deadline: "2027-01-15", sourceUrl: "https://worldbank.org/water", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000015", title: "Swiss Innovation Grants", titleRu: "Швейцарские инновационные гранты", description: "Tech startups and innovation hubs.", descriptionRu: "Технологические стартапы и инновационные хабы.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["technology", "innovation"], countryScope: ["Uzbekistan"], applicantTypes: ["Business", "Individual"], amountMin: 10000, amountMax: 50000, deadline: "2026-07-01", sourceUrl: "https://eda.admin.ch/innovation", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000016", title: "UNDP Biodiversity Protection", titleRu: "Защита биоразнообразия — ПРООН", description: "Conservation of ecosystems and wildlife.", descriptionRu: "Сохранение экосистем и дикой природы.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["environment", "biodiversity"], countryScope: ["Uzbekistan", "Kyrgyzstan"], applicantTypes: ["NGO"], amountMin: 40000, amountMax: 200000, deadline: "2026-09-01", sourceUrl: "https://undp.org/biodiversity", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000017", title: "EU Rule of Law Programme", titleRu: "Программа верховенства права ЕС", description: "Legal reform and judicial capacity building.", descriptionRu: "Правовая реформа и укрепление судебной системы.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["governance", "human_rights"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Government"], amountMin: 50000, amountMax: 250000, deadline: "2026-10-01", sourceUrl: "https://europa.eu/rule-of-law", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000018", title: "GIZ Rural Development", titleRu: "Сельское развитие — GIZ", description: "Integrated rural development programmes.", descriptionRu: "Комплексные программы сельского развития.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["agriculture", "rural"], countryScope: ["Uzbekistan", "Tajikistan"], applicantTypes: ["NGO"], amountMin: 35000, amountMax: 175000, deadline: "2026-11-01", sourceUrl: "https://giz.de/rural", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000019", title: "World Bank Research Grants", titleRu: "Исследовательские гранты — Всемирный банк", description: "Academic research on development economics.", descriptionRu: "Академические исследования экономики развития.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["research", "education"], countryScope: ["Uzbekistan", "Kazakhstan"], applicantTypes: ["Academic"], amountMin: 20000, amountMax: 100000, deadline: "2026-08-20", sourceUrl: "https://worldbank.org/research", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000020", title: "Swiss NGO Capacity Building", titleRu: "Укрепление потенциала НКО — Швейцария", description: "Organizational development for local NGOs.", descriptionRu: "Организационное развитие местных НКО.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["civil_society"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO"], amountMin: 10000, amountMax: 60000, deadline: "2026-07-15", sourceUrl: "https://eda.admin.ch/ngo-capacity", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000021", title: "UNDP Disaster Risk Reduction", titleRu: "Снижение риска бедствий — ПРООН", description: "Earthquake and flood preparedness projects.", descriptionRu: "Проекты готовности к землетрясениям и наводнениям.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["disaster", "environment"], countryScope: ["Uzbekistan", "Tajikistan"], applicantTypes: ["NGO", "Government"], amountMin: 45000, amountMax: 200000, deadline: "2026-09-20", sourceUrl: "https://undp.org/drr", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000022", title: "EU Digital Skills for Women", titleRu: "Цифровые навыки для женщин — ЕС", description: "ICT training programmes for women entrepreneurs.", descriptionRu: "Программы обучения ИКТ для женщин-предпринимателей.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["gender", "technology"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Individual"], amountMin: 25000, amountMax: 120000, deadline: "2026-08-10", sourceUrl: "https://europa.eu/digital-women", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000023", title: "GIZ Biotech Agriculture", titleRu: "Биотехнологии в сельском хозяйстве — GIZ", description: "Modern biotech solutions for sustainable farming.", descriptionRu: "Современные биотехнологии для устойчивого земледелия.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["biotech", "agriculture"], countryScope: ["Uzbekistan"], applicantTypes: ["Business", "NGO"], amountMin: 50000, amountMax: 220000, deadline: "2026-10-20", sourceUrl: "https://giz.de/biotech", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000024", title: "World Bank Urban Development", titleRu: "Городское развитие — Всемирный банк", description: "Smart city and urban infrastructure projects.", descriptionRu: "Умный город и городская инфраструктура.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["infrastructure", "urban"], countryScope: ["Uzbekistan"], applicantTypes: ["Government", "Business"], amountMin: 200000, amountMax: 800000, deadline: "2027-02-01", sourceUrl: "https://worldbank.org/urban", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000025", title: "Swiss Mental Health Initiative", titleRu: "Инициатива по психическому здоровью", description: "Community mental health support programmes.", descriptionRu: "Программы поддержки психического здоровья в сообществах.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["healthcare", "social"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO"], amountMin: 20000, amountMax: 90000, deadline: "2026-07-30", sourceUrl: "https://eda.admin.ch/mental-health", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000026", title: "UNDP Anti-Corruption Programme", titleRu: "Программа против коррупции — ПРООН", description: "Transparency and accountability initiatives.", descriptionRu: "Инициативы прозрачности и подотчётности.", donorKey: "a1000001-0000-4000-8000-000000000001", sectors: ["governance"], countryScope: ["Uzbekistan", "Kyrgyzstan"], applicantTypes: ["NGO", "Government"], amountMin: 40000, amountMax: 180000, deadline: "2026-11-20", sourceUrl: "https://undp.org/anti-corruption", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000027", title: "EU Media Freedom Fund", titleRu: "Фонд свободы СМИ — ЕС", description: "Independent journalism and media literacy.", descriptionRu: "Независимая журналистика и медиаграмотность.", donorKey: "a1000001-0000-4000-8000-000000000002", sectors: ["media", "civil_society"], countryScope: ["Uzbekistan", "Kazakhstan"], applicantTypes: ["NGO", "Individual"], amountMin: 30000, amountMax: 140000, deadline: "2026-09-10", sourceUrl: "https://europa.eu/media-freedom", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000028", title: "GIZ Export Promotion", titleRu: "Продвижение экспорта — GIZ", description: "Export readiness for Central Asian businesses.", descriptionRu: "Подготовка бизнеса ЦА к экспорту.", donorKey: "a1000001-0000-4000-8000-000000000003", sectors: ["economy", "trade"], countryScope: ["Uzbekistan", "Kazakhstan"], applicantTypes: ["Business"], amountMin: 60000, amountMax: 280000, deadline: "2026-10-05", sourceUrl: "https://giz.de/export", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000029", title: "World Bank Inclusive Education", titleRu: "Инклюзивное образование — Всемирный банк", description: "Education access for children with disabilities.", descriptionRu: "Доступ к образованию для детей с инвалидностью.", donorKey: "a1000001-0000-4000-8000-000000000004", sectors: ["education", "social"], countryScope: ["Uzbekistan"], applicantTypes: ["NGO", "Government", "Academic"], amountMin: 80000, amountMax: 350000, deadline: "2026-12-15", sourceUrl: "https://worldbank.org/inclusive-ed", isFeatured: false },
  { key: "b2000001-0000-4000-8000-000000000030", title: "Swiss Art & Culture Exchange", titleRu: "Обмен в сфере искусства и культуры", description: "Cross-border cultural exchange programmes.", descriptionRu: "Трансграничные программы культурного обмена.", donorKey: "a1000001-0000-4000-8000-000000000005", sectors: ["culture", "arts"], countryScope: ["Uzbekistan", "Switzerland"], applicantTypes: ["NGO", "Individual"], amountMin: 8000, amountMax: 40000, deadline: "2026-06-15", sourceUrl: "https://eda.admin.ch/culture-exchange", isFeatured: false },
];

export const SEED_GRANT_REQUIREMENTS = [
  { grantKey: "b2000001-0000-4000-8000-000000000001", requirementType: "org_type", text: "Зарегистрированная НКО или государственная организация", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000001", requirementType: "experience", text: "Минимум 2 года опыта в экологических проектах", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000001", requirementType: "documents", text: "Учредительные документы и финансовая отчётность", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000002", requirementType: "org_type", text: "НКО, зарегистрированная в Узбекистане", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000002", requirementType: "experience", text: "Опыт работы с целевыми группами не менее 1 года", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000004", requirementType: "org_type", text: "Государственное учреждение или университет", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000004", requirementType: "budget", text: "Софинансирование не менее 20%", required: false },
  { grantKey: "b2000001-0000-4000-8000-000000000009", requirementType: "org_type", text: "Зарегистрированное юридическое лицо (МСП)", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000009", requirementType: "experience", text: "Действующий бизнес не менее 1 года", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000012", requirementType: "org_type", text: "НКО или коммерческая организация", required: true },
  { grantKey: "b2000001-0000-4000-8000-000000000012", requirementType: "documents", text: "Техническое обоснование проекта", required: true },
] as const;

export function parseDeadline(dateStr: string): number {
  return new Date(`${dateStr}T23:59:59.000Z`).getTime();
}
