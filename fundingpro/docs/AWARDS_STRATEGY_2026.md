# FundingPro → 1 место в President Tech Award и President AI Award (2026)

Исполняемая спецификация («мастер-промпт») для победы в двух госпрограммах на awards.gov.uz —
в стиле [`LAB_ONBOARDING_SPEC.md`](./LAB_ONBOARDING_SPEC.md). Сопровождающие документы:
[`JUDGE_EVIDENCE_PACKET.md`](./JUDGE_EVIDENCE_PACKET.md) (доказательная база для Fact-Checking) и
[`AWARDS_SUBMISSION_PLAYBOOK.md`](./AWARDS_SUBMISSION_PLAYBOOK.md) (пошаговая подготовка по
стадиям отбора).

## Context

В прошлом сезоне FundingPro участвовал в President Tech Award и проиграл: «продукт был слабый,
трекшна не было». За последнюю рабочую сессию продукт качественно изменился — исправлены
критические баги монетизации и AI (истечение подписок, mock-AI за деньги, редакция PII), построен
security-аудит с 0 открытых findings, 132 автотеста и зелёный CI, реальный intake-пайплайн
грантов, фича Opportunities Lab. Задача этого документа — не «доделать платформу», а **упаковать
её под два конкретных жюри** так, чтобы максимизировать шанс 1 места в обеих программах.

Сайт awards.gov.uz на прямой запрос отдал 503 (антибот/гео) — факты собраны из вторичных
источников (пресса, IT Park, президентский сайт), процитированы ниже. Точные дедлайны
регистрации 2026 и точный список 10 секторов трека «Best Startup Project» **не подтверждены** —
сверка напрямую на портале зафиксирована как Стадия 0 в submission playbook.

## Исследованные факты

**President Tech Award 2026** — призовой фонд расширен с $1 млн до **$5 млн**
([kun.uz](https://kun.uz/en/news/2026/02/26/from-1-million-to-5-million-president-tech-award-sees-massive-funding-hike),
[TimesCA](https://timesca.com/uzbekistan-expands-president-tech-award-to-5-million-launches-1-million-ai-startup-competition/)).
Три трека:
- **Incubation** — ранняя стадия, product-market fit, международное менторство; 25 победителей
  делят $1 млн грантов.
- **Acceleration** — стадия роста; $1.5 млн инвестиций.
- **Best Startup Project** — 10 секторов, 10 победителей, $2.5 млн от IT Park Ventures,
  международное жюри.
- Участие — только граждане Узбекистана. Прошлый сезон: 6000+ участников, 862 команды.

**President AI Award 2026** (новая, отдельная программа, тоже через awards.gov.uz) — первый
госконкурс полностью для AI-стартапов, **$1 млн**, 5 секторов: госуправление, индустрия и
предпринимательство, здравоохранение, образование, зелёная экономика/агротех. 25 полуфиналистов
(по 5 на сектор) → акселерация → по 3 победителя на сектор: $100k / $60k / $40k
([TimesCA](https://timesca.com/uzbekistan-expands-president-tech-award-to-5-million-launches-1-million-ai-startup-competition/)).

**Воронка отбора** (по циклу 2024, вероятно похожа в 2026,
[it-park.uz](http://www.it-park.uz/ru/itpark/news/president-tech-award-2024-finalnye-etapy-i-daty-provedeniya)):
Заявка → Менторские сессии → **Demo Day** (50+ команд → 15, по 3 на категорию) →
**Fact-Checking** (проверка работоспособности продукта и качества кода — именно здесь прошлогодний
слабый продукт был бы отсеян) → Pitch Polish (буткемп) → Grand Final перед международным жюри.

## Ключевые решения

1. **ZOOMRAD убран из питча.** В коде интеграции нет; честная позиция («работаем напрямую через
   Payme/Click/Uzum») безопаснее на Fact-Checking, чем заявленное несуществующее партнёрство.
2. **Репозиционирование: Бизнес + Молодёжь, НКО — не в фокусе.** У НКО нет денег на подписку —
   слабая история монетизации для жюри. `NGO` остаётся поддерживаемым `applicantType` в фильтрах
   каталога (данные не удалены), но убран из лендинга, прайсинга и питч-нарратива.
3. **Трек-фит** (критерий: вероятность реализации × продажи):

   | Программа | Трек | Продукт | Сегмент | Монетизация |
   |---|---|---|---|---|
   | President Tech Award | Incubation | FundingPro Business | МСБ, предприниматели | Success fee 2–5% + подписки + консультант-маркетплейс |
   | President AI Award | Образование | Opportunities Lab | Молодёжь, студенты | Freemium → платный тариф |

   Incubation, а не Acceleration/Best Startup — честно соответствует стадии (готовый продукт,
   ещё без выручки), без переобещания. Образование — под уже построенный Lab с каракалпакской
   локализацией — сильный, честно демонстрируемый за недели инклюзивный нарратив.
4. **Таймлайн не подтверждён** → в submission playbook сверка дедлайна вынесена в Стадию 0,
   вопрос глубины pilot-трекшна (soft-launch vs реальные платежи) — открытая переменная,
   зависящая от оставшегося времени.

## Выполненные workstream'ы

**W1 — Репозиционирование копирайта.** `components/landing/LandingHowItWorksSection.tsx`,
`LandingTrustStripSection.tsx`, `LandingCtaSection.tsx`, `LandingPricingSection.tsx`,
`app/pricing/page.tsx` (meta description), `convex/seedData.ts` (`SEED_PLANS.nameRu`),
`mobile/lib/public-fallback.ts` (синхронизированный fallback). `targetType`/`slug` тарифов не
менялись — только видимые названия и описания.

**W2 — Success-fee tracking.** Новая аддитивная таблица `successFeeRecords` (`convex/schema.ts`).
Модуль `convex/successFee.ts`: `recordWinIfNeeded` (вызывается из `applications.update` при
переводе в статус `won` с указанием суммы; идемпотентно — одна запись на заявку; сумма
«замораживается» после того, как ops пометил запись `invoiced`/`paid`/`waived`), `getMyRecord`,
`adminList`, `adminUpdateStatus`. Процент — конфигурируемый через `settings.successFeePercent`
(seed-значение 3%, clamp 2–5% по правовому документу), не хардкод. Admin UI —
`/admin/success-fees`. REST — `/api/v1/admin/success-fees`, `/api/v1/admin/success-fees/[id]`,
и `wonAmountUsd` добавлен в `PATCH /api/v1/applications/[id]`. 4 новых теста
(`convex/successFee.test.ts`): создание записи, идемпотентность при повторной отметке,
конфигурируемый процент, заморозка суммы после `invoiced`.

**W3 — Ребаланс каталога.** 2 новых донора (`EBRD`, `IT Park Uzbekistan`) и 4 новые реальные
бизнес-программы в `convex/seedData.ts` (записи 38–41): IT Park Ventures ($10k–$1M),
IT Park Digital Startups Program, EBRD Youth in Business, EBRD Advice for Small Businesses —
все с проверенными source URL, без выдуманных дедлайнов/сумм там, где донор их не публикует.

**W4 — Judge Evidence Packet.** [`JUDGE_EVIDENCE_PACKET.md`](./JUDGE_EVIDENCE_PACKET.md) —
консолидация того, что уже реально есть (тесты, CI, security-аудит, платежи, AI-гейтвей,
юр. документы) и честный список того, что не готово.

**W5 — Submission Playbook.** [`AWARDS_SUBMISSION_PLAYBOOK.md`](./AWARDS_SUBMISSION_PLAYBOOK.md) —
пошагово под 5-стадийную воронку, отдельные сценарии для Business/Education нарративов.

**W6 — Явно вне кода.** Зафиксировано в Submission Playbook, Стадия 0: подтверждение дедлайна и
списка секторов на портале, регистрация команды, состав команды, глубина pilot-трекшна, запись
демо-видео, дизайн слайдов.

## Acceptance criteria

| # | Критерий | Результат |
|---|---|---|
| B1 | Копирайт репозиционирован | ✅ 0 вхождений «НКО» в лендинге/прайсинге/`SEED_PLANS.nameRu`/mobile fallback |
| B2 | Success-fee — реальная функция | ✅ новая таблица, 4 новых теста, admin-view `/admin/success-fees` |
| B3 | Каталог сбалансирован | ✅ 4 новые реальные бизнес-программы с проверенными URL + youth-блок (Erasmus+/UNESCO/AEIF, добавлены ранее) |
| B4 | Существующие тесты не сломаны | ✅ node/convex — см. раздел «Результаты измерения» |
| B5 | Typecheck/Lint/Guards | ✅ 0 ошибок, 0 warnings |
| B6 | Прод-сборка | ✅ |
| B7 | Документы созданы и связаны | ✅ этот файл + `JUDGE_EVIDENCE_PACKET.md` + `AWARDS_SUBMISSION_PLAYBOOK.md`, ссылка из README |
| B8 | Открытые вопросы явно зафиксированы | ✅ Submission Playbook, Стадия 0 и «Трекшн-трек» |

## Результаты измерения (2026-07-02)

| Проверка | Результат |
|---|---|
| `npm run typecheck` (весь монорепо) | ✅ 0 ошибок |
| `npm test` (node) | ✅ 101/101 |
| `npm run test:convex` | ✅ 31/31 (было 21 до Lab/Awards workstream'ов этой сессии; +4 успех-фи, +6 Lab) |
| `npm run lint` | ✅ 0 warnings |
| `convex-collect-audit` / `convex-any-audit` | ✅ pass |
| `npm run build` (прод, CI-плейсхолдер env) | ✅ success; `/admin/success-fees`, `/api/v1/admin/success-fees[/:id]` в манифесте |
| grep «НКО» в лендинге/`app/pricing`/mobile fallback | ✅ 0 (после фикса inline JSON-LD-описания в `app/pricing/page.tsx`) |
| Новые бизнес-программы в каталоге | ✅ 5 упоминаний (IT Park Ventures, Digital Startups Program, EBRD Youth in Business, EBRD Advice) |

Ветка: `claude/startup-audit-council-o7wlip`, PR #2 (обновится после пуша).
