-- FundingPro seed data
-- Run after migrations: supabase db reset OR psql -f supabase/seed.sql

-- Clear existing seed data (idempotent re-seed)
TRUNCATE TABLE grant_requirements, saved_grants, eligibility_checks, applications,
  consultant_orders, consultant_profiles, grants, donors, plans, settings
RESTART IDENTITY CASCADE;

-- ─── DONORS ──────────────────────────────────────────────────────────────────

INSERT INTO donors (id, name, name_ru, short_name, country, website, description) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'UNDP', 'ПРООН', 'UNDP', 'International', 'https://www.undp.org', 'Программа развития ООН'),
  ('a1000001-0000-4000-8000-000000000002', 'European Union', 'Европейский Союз', 'EU', 'European Union', 'https://europa.eu', 'Грантовые программы ЕС для Центральной Азии'),
  ('a1000001-0000-4000-8000-000000000003', 'GIZ', 'GIZ', 'GIZ', 'Germany', 'https://www.giz.de', 'Немецкое общество международного сотрудничества'),
  ('a1000001-0000-4000-8000-000000000004', 'World Bank', 'Всемирный банк', 'WB', 'International', 'https://www.worldbank.org', 'Международные проекты развития'),
  ('a1000001-0000-4000-8000-000000000005', 'Swiss Embassy', 'Посольство Швейцарии', 'Swiss', 'Switzerland', 'https://www.eda.admin.ch', 'Швейцарское сотрудничество в Узбекистане');

-- ─── PLANS ───────────────────────────────────────────────────────────────────

INSERT INTO plans (id, name, name_ru, target_type, price_usd, price_uzs, features) VALUES
  ('plan-ngo-basic', 'Basic', 'НКО / Физлица Basic', 'NGO', 30, 384000, '["Доступ к базе грантов", "5 AI-проверок", "2 черновика заявок"]'),
  ('plan-ngo-pro', 'Pro', 'НКО / Физлица Pro', 'NGO', 50, 640000, '["Безлимитные AI-проверки", "10 черновиков", "Хранилище документов"]'),
  ('plan-consulting', 'Consulting', 'Консалтинг', 'NGO', 100, 1280000, '["Персональный консультант", "Pre-application review"]'),
  ('plan-business-starter', 'Starter', 'Бизнес Starter', 'BUSINESS', 90, 1152000, '["Корпоративный профиль", "До 3 пользователей"]'),
  ('plan-business-pro', 'Pro', 'Бизнес Pro', 'BUSINESS', 200, 2560000, '["До 10 пользователей", "5 часов консультаций"]'),
  ('plan-enterprise', 'Enterprise', 'Enterprise', 'ENTERPRISE', 500, 6400000, '["Индивидуальные условия", "Выделенный менеджер"]');

-- ─── SETTINGS ────────────────────────────────────────────────────────────────

INSERT INTO settings (key, value, category) VALUES
  ('paymentsIntegrationStatus', 'pending', 'integrations'),
  ('aiProviderStatus', 'mock', 'integrations'),
  ('paymentIntegrationStatus', 'pending_integration', 'integrations'),
  ('appDisclaimer', 'FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить заявку.', 'legal');

-- ─── SAMPLE ORGANIZATIONS ────────────────────────────────────────────────────

INSERT INTO organizations (id, name, legal_name, type, country, city, sector, is_verified) VALUES
  ('d3000001-0000-4000-8000-000000000001', 'ЭкоНКО Узбекистан', 'ЭкоНКО Узбекистан ННО', 'NGO', 'Uzbekistan', 'Ташкент', 'environment', true),
  ('d3000001-0000-4000-8000-000000000002', 'АгроКонсалт ООО', 'АгроКонсалт ООО', 'BUSINESS', 'Uzbekistan', 'Самарканд', 'agriculture', false),
  ('d3000001-0000-4000-8000-000000000003', 'Центр образования', 'Центр инновационного образования', 'ACADEMIC', 'Uzbekistan', 'Ташкент', 'education', true)
ON CONFLICT (id) DO NOTHING;

-- ─── CONSULTANTS ─────────────────────────────────────────────────────────────

INSERT INTO consultant_profiles (full_name, specialty, specialties, country, rating, review_count, is_verified, is_active, bio, packages) VALUES
  ('Алексей Иванов', 'Грантовое письмо UNDP/EU', ARRAY['EU grants', 'UNDP grants'], 'Узбекистан', 4.90, 34, true, true,
   'Специалист по международным грантам ПРООН и ЕС. Помогаю НКО и малым бизнесам в подготовке заявок.',
   '[{"name":"Проверка черновика","price":"$150"},{"name":"Полная подготовка заявки","price":"$500"}]'),
  ('Диана Рашидова', 'GIZ / Немецкое сотрудничество', ARRAY['GIZ grants', 'climate grants'], 'Казахстан', 4.80, 21, true, true,
   'Опыт работы с GIZ более 8 лет. Специализация — сельское хозяйство и устойчивое развитие.',
   '[{"name":"Консультация 1 час","price":"$80"},{"name":"Сопровождение заявки","price":"$400"}]'),
  ('Тимур Ахмедов', 'World Bank / бюджетирование', ARRAY['World Bank grants', 'business grants'], 'Узбекистан', 4.70, 18, true, true,
   'Финансовый консультант с опытом в проектах World Bank и ADB. Помогаю выстроить бюджетную структуру.',
   '[{"name":"Бюджетная структура","price":"$200"},{"name":"Полный финансовый пакет","price":"$600"}]'),
  ('Малика Карабаева', 'НКО и гражданское общество', ARRAY['NGO grants', 'gender grants'], 'Кыргызстан', 4.85, 27, true, true,
   'Эксперт по грантам для НКО и инициатив в области прав человека и гендерного равенства.',
   '[{"name":"Оценка соответствия","price":"$100"},{"name":"Полный пакет заявки","price":"$450"}]'),
  ('Сергей Петров', 'Образование и исследования', ARRAY['education grants', 'EU grants'], 'Узбекистан', 4.75, 15, true, true,
   'Консультант по грантам в сфере образования, науки и инноваций для университетов и школ.',
   '[{"name":"Концепт-нота","price":"$120"},{"name":"Полная заявка","price":"$550"}]');

-- ─── GRANTS (30) ─────────────────────────────────────────────────────────────

INSERT INTO grants (id, title, title_ru, description, description_ru, donor_id, sectors, country_scope, applicant_types, amount_min, amount_max, deadline, source_url, is_featured) VALUES
('b2000001-0000-4000-8000-000000000001', 'Climate Resilience for Central Asia', 'Устойчивость к изменению климата в Центральной Азии', 'Support for climate adaptation projects in CA region.', 'Поддержка проектов адаптации к изменению климата в регионе ЦА.', 'a1000001-0000-4000-8000-000000000001', ARRAY['climate', 'environment'], ARRAY['Uzbekistan', 'Kazakhstan', 'Kyrgyzstan'], ARRAY['NGO', 'Government'], 50000, 250000, '2026-09-30', 'https://undp.org/grants/climate-ca', true),
('b2000001-0000-4000-8000-000000000002', 'EU Civil Society Support Programme', 'Программа поддержки гражданского общества ЕС', 'Strengthening civil society organizations in Uzbekistan.', 'Укрепление организаций гражданского общества в Узбекистане.', 'a1000001-0000-4000-8000-000000000002', ARRAY['civil_society', 'human_rights'], ARRAY['Uzbekistan'], ARRAY['NGO'], 30000, 150000, '2026-08-15', 'https://europa.eu/grants/cso-uz', true),
('b2000001-0000-4000-8000-000000000003', 'GIZ Green Economy Initiative', 'Инициатива GIZ по зелёной экономике', 'Sustainable agriculture and green business development.', 'Устойчивое сельское хозяйство и развитие зелёного бизнеса.', 'a1000001-0000-4000-8000-000000000003', ARRAY['agriculture', 'economy'], ARRAY['Uzbekistan', 'Tajikistan'], ARRAY['NGO', 'Business'], 40000, 200000, '2026-10-01', 'https://giz.de/grants/green-economy', false),
('b2000001-0000-4000-8000-000000000004', 'World Bank Education Modernization', 'Модернизация образования — Всемирный банк', 'Digital transformation of schools and universities.', 'Цифровая трансформация школ и университетов.', 'a1000001-0000-4000-8000-000000000004', ARRAY['education', 'technology'], ARRAY['Uzbekistan'], ARRAY['Government', 'Academic'], 100000, 500000, '2026-11-30', 'https://worldbank.org/education-uz', true),
('b2000001-0000-4000-8000-000000000005', 'Swiss Water Management Fund', 'Швейцарский фонд управления водными ресурсами', 'Water conservation and irrigation efficiency projects.', 'Проекты по сохранению воды и эффективности орошения.', 'a1000001-0000-4000-8000-000000000005', ARRAY['water', 'environment'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Government'], 25000, 120000, '2026-07-20', 'https://eda.admin.ch/water-uz', false),
('b2000001-0000-4000-8000-000000000006', 'UNDP Youth Employment Programme', 'Программа занятости молодёжи ПРООН', 'Skills training and entrepreneurship for youth.', 'Обучение навыкам и предпринимательство для молодёжи.', 'a1000001-0000-4000-8000-000000000001', ARRAY['youth', 'economy'], ARRAY['Uzbekistan', 'Kyrgyzstan'], ARRAY['NGO', 'Business'], 20000, 100000, '2026-08-30', 'https://undp.org/youth-employment', false),
('b2000001-0000-4000-8000-000000000007', 'EU Gender Equality Grants', 'Гранты ЕС на гендерное равенство', 'Projects promoting women empowerment and gender equality.', 'Проекты по расширению прав женщин и гендерному равенству.', 'a1000001-0000-4000-8000-000000000002', ARRAY['gender', 'human_rights'], ARRAY['Uzbekistan', 'Tajikistan'], ARRAY['NGO'], 35000, 175000, '2026-09-15', 'https://europa.eu/gender-ca', false),
('b2000001-0000-4000-8000-000000000008', 'GIZ Healthcare Access', 'Доступ к здравоохранению — GIZ', 'Improving primary healthcare in rural areas.', 'Улучшение первичной медицинской помощи в сельских районах.', 'a1000001-0000-4000-8000-000000000003', ARRAY['healthcare'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Government'], 45000, 180000, '2026-10-15', 'https://giz.de/healthcare', false),
('b2000001-0000-4000-8000-000000000009', 'World Bank SME Development', 'Развитие МСП — Всемирный банк', 'Support for small and medium enterprises.', 'Поддержка малых и средних предприятий.', 'a1000001-0000-4000-8000-000000000004', ARRAY['economy', 'business'], ARRAY['Uzbekistan', 'Kazakhstan'], ARRAY['Business'], 75000, 300000, '2026-12-01', 'https://worldbank.org/sme', true),
('b2000001-0000-4000-8000-000000000010', 'Swiss Cultural Heritage Fund', 'Швейцарский фонд культурного наследия', 'Preservation of cultural heritage sites.', 'Сохранение объектов культурного наследия.', 'a1000001-0000-4000-8000-000000000005', ARRAY['culture', 'heritage'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Government'], 15000, 80000, '2026-06-30', 'https://eda.admin.ch/heritage', false),
('b2000001-0000-4000-8000-000000000011', 'UNDP Digital Governance', 'Цифровое управление — ПРООН', 'E-government and digital public services.', 'Электронное правительство и цифровые госуслуги.', 'a1000001-0000-4000-8000-000000000001', ARRAY['technology', 'governance'], ARRAY['Uzbekistan'], ARRAY['Government'], 60000, 250000, '2026-11-15', 'https://undp.org/digital-gov', false),
('b2000001-0000-4000-8000-000000000012', 'EU Renewable Energy Fund', 'Фонд возобновляемой энергии ЕС', 'Solar and wind energy projects in Central Asia.', 'Проекты солнечной и ветровой энергии в ЦА.', 'a1000001-0000-4000-8000-000000000002', ARRAY['energy', 'climate'], ARRAY['Uzbekistan', 'Kazakhstan'], ARRAY['Business', 'NGO'], 80000, 400000, '2026-10-30', 'https://europa.eu/renewable', true),
('b2000001-0000-4000-8000-000000000013', 'GIZ Vocational Training', 'Профессиональное обучение — GIZ', 'Vocational education and workforce development.', 'Профессиональное образование и развитие кадров.', 'a1000001-0000-4000-8000-000000000003', ARRAY['education', 'youth'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Academic'], 30000, 150000, '2026-08-01', 'https://giz.de/vocational', false),
('b2000001-0000-4000-8000-000000000014', 'World Bank Water Infrastructure', 'Водная инфраструктура — Всемирный банк', 'Rural water supply and sanitation projects.', 'Сельское водоснабжение и санитария.', 'a1000001-0000-4000-8000-000000000004', ARRAY['water', 'infrastructure'], ARRAY['Uzbekistan', 'Tajikistan'], ARRAY['Government'], 150000, 600000, '2027-01-15', 'https://worldbank.org/water', false),
('b2000001-0000-4000-8000-000000000015', 'Swiss Innovation Grants', 'Швейцарские инновационные гранты', 'Tech startups and innovation hubs.', 'Технологические стартапы и инновационные хабы.', 'a1000001-0000-4000-8000-000000000005', ARRAY['technology', 'innovation'], ARRAY['Uzbekistan'], ARRAY['Business', 'Individual'], 10000, 50000, '2026-07-01', 'https://eda.admin.ch/innovation', false),
('b2000001-0000-4000-8000-000000000016', 'UNDP Biodiversity Protection', 'Защита биоразнообразия — ПРООН', 'Conservation of ecosystems and wildlife.', 'Сохранение экосистем и дикой природы.', 'a1000001-0000-4000-8000-000000000001', ARRAY['environment', 'biodiversity'], ARRAY['Uzbekistan', 'Kyrgyzstan'], ARRAY['NGO'], 40000, 200000, '2026-09-01', 'https://undp.org/biodiversity', false),
('b2000001-0000-4000-8000-000000000017', 'EU Rule of Law Programme', 'Программа верховенства права ЕС', 'Legal reform and judicial capacity building.', 'Правовая реформа и укрепление судебной системы.', 'a1000001-0000-4000-8000-000000000002', ARRAY['governance', 'human_rights'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Government'], 50000, 250000, '2026-10-01', 'https://europa.eu/rule-of-law', false),
('b2000001-0000-4000-8000-000000000018', 'GIZ Rural Development', 'Сельское развитие — GIZ', 'Integrated rural development programmes.', 'Комплексные программы сельского развития.', 'a1000001-0000-4000-8000-000000000003', ARRAY['agriculture', 'rural'], ARRAY['Uzbekistan', 'Tajikistan'], ARRAY['NGO'], 35000, 175000, '2026-11-01', 'https://giz.de/rural', false),
('b2000001-0000-4000-8000-000000000019', 'World Bank Research Grants', 'Исследовательские гранты — Всемирный банк', 'Academic research on development economics.', 'Академические исследования экономики развития.', 'a1000001-0000-4000-8000-000000000004', ARRAY['research', 'education'], ARRAY['Uzbekistan', 'Kazakhstan'], ARRAY['Academic'], 20000, 100000, '2026-08-20', 'https://worldbank.org/research', false),
('b2000001-0000-4000-8000-000000000020', 'Swiss NGO Capacity Building', 'Укрепление потенциала НКО — Швейцария', 'Organizational development for local NGOs.', 'Организационное развитие местных НКО.', 'a1000001-0000-4000-8000-000000000005', ARRAY['civil_society'], ARRAY['Uzbekistan'], ARRAY['NGO'], 10000, 60000, '2026-07-15', 'https://eda.admin.ch/ngo-capacity', false),
('b2000001-0000-4000-8000-000000000021', 'UNDP Disaster Risk Reduction', 'Снижение риска бедствий — ПРООН', 'Earthquake and flood preparedness projects.', 'Проекты готовности к землетрясениям и наводнениям.', 'a1000001-0000-4000-8000-000000000001', ARRAY['disaster', 'environment'], ARRAY['Uzbekistan', 'Tajikistan'], ARRAY['NGO', 'Government'], 45000, 200000, '2026-09-20', 'https://undp.org/drr', false),
('b2000001-0000-4000-8000-000000000022', 'EU Digital Skills for Women', 'Цифровые навыки для женщин — ЕС', 'ICT training programmes for women entrepreneurs.', 'Программы обучения ИКТ для женщин-предпринимателей.', 'a1000001-0000-4000-8000-000000000002', ARRAY['gender', 'technology'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Individual'], 25000, 120000, '2026-08-10', 'https://europa.eu/digital-women', false),
('b2000001-0000-4000-8000-000000000023', 'GIZ Biotech Agriculture', 'Биотехнологии в сельском хозяйстве — GIZ', 'Modern biotech solutions for sustainable farming.', 'Современные биотехнологии для устойчивого земледелия.', 'a1000001-0000-4000-8000-000000000003', ARRAY['biotech', 'agriculture'], ARRAY['Uzbekistan'], ARRAY['Business', 'NGO'], 50000, 220000, '2026-10-20', 'https://giz.de/biotech', false),
('b2000001-0000-4000-8000-000000000024', 'World Bank Urban Development', 'Городское развитие — Всемирный банк', 'Smart city and urban infrastructure projects.', 'Умный город и городская инфраструктура.', 'a1000001-0000-4000-8000-000000000004', ARRAY['infrastructure', 'urban'], ARRAY['Uzbekistan'], ARRAY['Government', 'Business'], 200000, 800000, '2027-02-01', 'https://worldbank.org/urban', false),
('b2000001-0000-4000-8000-000000000025', 'Swiss Mental Health Initiative', 'Инициатива по психическому здоровью', 'Community mental health support programmes.', 'Программы поддержки психического здоровья в сообществах.', 'a1000001-0000-4000-8000-000000000005', ARRAY['healthcare', 'social'], ARRAY['Uzbekistan'], ARRAY['NGO'], 20000, 90000, '2026-07-30', 'https://eda.admin.ch/mental-health', false),
('b2000001-0000-4000-8000-000000000026', 'UNDP Anti-Corruption Programme', 'Программа против коррупции — ПРООН', 'Transparency and accountability initiatives.', 'Инициативы прозрачности и подотчётности.', 'a1000001-0000-4000-8000-000000000001', ARRAY['governance'], ARRAY['Uzbekistan', 'Kyrgyzstan'], ARRAY['NGO', 'Government'], 40000, 180000, '2026-11-20', 'https://undp.org/anti-corruption', false),
('b2000001-0000-4000-8000-000000000027', 'EU Media Freedom Fund', 'Фонд свободы СМИ — ЕС', 'Independent journalism and media literacy.', 'Независимая журналистика и медиаграмотность.', 'a1000001-0000-4000-8000-000000000002', ARRAY['media', 'civil_society'], ARRAY['Uzbekistan', 'Kazakhstan'], ARRAY['NGO', 'Individual'], 30000, 140000, '2026-09-10', 'https://europa.eu/media-freedom', false),
('b2000001-0000-4000-8000-000000000028', 'GIZ Export Promotion', 'Продвижение экспорта — GIZ', 'Export readiness for Central Asian businesses.', 'Подготовка бизнеса ЦА к экспорту.', 'a1000001-0000-4000-8000-000000000003', ARRAY['economy', 'trade'], ARRAY['Uzbekistan', 'Kazakhstan'], ARRAY['Business'], 60000, 280000, '2026-10-05', 'https://giz.de/export', false),
('b2000001-0000-4000-8000-000000000029', 'World Bank Inclusive Education', 'Инклюзивное образование — Всемирный банк', 'Education access for children with disabilities.', 'Доступ к образованию для детей с инвалидностью.', 'a1000001-0000-4000-8000-000000000004', ARRAY['education', 'social'], ARRAY['Uzbekistan'], ARRAY['NGO', 'Government', 'Academic'], 80000, 350000, '2026-12-15', 'https://worldbank.org/inclusive-ed', false),
('b2000001-0000-4000-8000-000000000030', 'Swiss Art & Culture Exchange', 'Обмен в сфере искусства и культуры', 'Cross-border cultural exchange programmes.', 'Трансграничные программы культурного обмена.', 'a1000001-0000-4000-8000-000000000005', ARRAY['culture', 'arts'], ARRAY['Uzbekistan', 'Switzerland'], ARRAY['NGO', 'Individual'], 8000, 40000, '2026-06-15', 'https://eda.admin.ch/culture-exchange', false);

-- Sample requirements for featured grants
INSERT INTO grant_requirements (grant_id, requirement_type, text, required) VALUES
('b2000001-0000-4000-8000-000000000001', 'org_type', 'Зарегистрированная НКО или государственная организация', true),
('b2000001-0000-4000-8000-000000000001', 'experience', 'Минимум 2 года опыта в экологических проектах', true),
('b2000001-0000-4000-8000-000000000001', 'documents', 'Учредительные документы и финансовая отчётность', true),
('b2000001-0000-4000-8000-000000000002', 'org_type', 'НКО, зарегистрированная в Узбекистане', true),
('b2000001-0000-4000-8000-000000000002', 'experience', 'Опыт работы с целевыми группами не менее 1 года', true),
('b2000001-0000-4000-8000-000000000004', 'org_type', 'Государственное учреждение или университет', true),
('b2000001-0000-4000-8000-000000000004', 'budget', 'Софинансирование не менее 20%', false),
('b2000001-0000-4000-8000-000000000009', 'org_type', 'Зарегистрированное юридическое лицо (МСП)', true),
('b2000001-0000-4000-8000-000000000009', 'experience', 'Действующий бизнес не менее 1 года', true),
('b2000001-0000-4000-8000-000000000012', 'org_type', 'НКО или коммерческая организация', true),
('b2000001-0000-4000-8000-000000000012', 'documents', 'Техническое обоснование проекта', true);
