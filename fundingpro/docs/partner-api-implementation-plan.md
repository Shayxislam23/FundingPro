# Partner API: план внедрения (пилот `jizzakh_business_platform`)

Статус: **черновик на утверждение**. Код не менялся.
Дата аудита: 2026-11-17. Ветка: `main` @ `faf66c9` (последний коммит 2026-07-15).
Дополнительно изучена неслитая ветка `cursor/mobile-zoomrad-bank-integration-44d6` (2026-09-03).

---

## 0. Короткое резюме

* Партнёрский API можно построить на текущем стеке (**Next.js 15 + Convex + Vercel**) без смены технологий.
* Примерно половину инфраструктуры можно переиспользовать: rate limiter, CORS-хелпер, обёртки маршрутов, хеширование токенов и HMAC из ветки ZOOMRAD, а также тестовый стек (node:test + convex-test + vitest).
* **Модели лидов и CRM в проекте нет.** Её нужно создавать с нуля.
* **В модели гранта не хватает полей**, которых требует ТЗ: узбекский язык, регионы, теги, софинансирование, `last_verified_at`, `published_at`, `slug`, язык заявки.
* Три вещи нужно решить **до начала разработки** (подробнее в §3):
  1. production-каталог пуст (0 грантов), поэтому партнёру нечего показывать;
  2. весь каталог уже сейчас можно выгрузить через публичный `/api/v1/grants` и напрямую через Convex, и это обнуляет смысл запрета на «массовую выгрузку»;
  3. юридический вопрос о локализации персональных данных граждан РУз: лиды будут храниться в Convex (облако за рубежом).
* Оценка: **около 4–5 недель календарного времени** для одного разработчика, пилот с партнёром ещё 30 дней.

---

## 1. Существующая архитектура

| Слой | Технология | Где |
|---|---|---|
| Web + REST API | Next.js 15.5 (App Router), route handlers | `fundingpro/app/api/v1/**` (~80 маршрутов) |
| База данных / backend | **Convex** (документная БД + серверные функции, не SQL) | `fundingpro/convex/*`, схема `convex/schema.ts` (~45 таблиц) |
| Аутентификация пользователей | Clerk 7 → JWT для Convex | `lib/auth-helpers.ts`, `convex/auth.config.ts` |
| Админ-доступ | список email + роль в Convex | `lib/auth/admin-access*.ts`, `withAdmin()` |
| Хостинг | Vercel (`www.fundingpro.uz`) | `vercel.json` |
| Мобильное приложение | Expo / React Native, использует тот же `/api/v1` | `mobile/` |
| Общие типы | Zod-схемы | `packages/api-types` |
| Тесты | node:test (`tests/*.test.mjs`), vitest + convex-test (`convex/*.test.ts`), Playwright e2e, Maestro (mobile) | |
| CI | GitHub Actions `main-ci.yml`, `release-gate.yml` | **не работают: аккаунт GitHub заблокирован по оплате** |

### 1.1 Текущие модели

* **Гранты:** `grants` (title, titleRu, description, descriptionRu, donorId, sectors[], countryScope[], applicantTypes[], amountMin/Max, currency, deadline, openDate, sourceUrl, status, isActive, isFeatured, lastUpdatedAt), `grantRequirements`, `donors`.
* **Пользователи:** `users`, `userIdentities`, `organizations`, `organizationMembers`, `userConsents` (версионированные согласия; можно взять за образец).
* **Заявки:** `applications`, `labOpportunityApplications`, `proposalProjects/Sections`, `eligibilityChecks`.
* **Коммерция:** `payments`, `subscriptions`, `consultantOrders`, `successFeeRecords`, транзакции Payme/Uzum/Click.
* **Лиды / CRM:** **отсутствуют.** `POST /api/v1/lead-magnet` только отправляет письмо через Resend и пишет email в `console.info` (ничего не сохраняет).
* **Логи:** `auditLogs` (действия пользователей/админов), `aiRequests`, `console.*` → Vercel logs. Журнала API-запросов нет.
* **Rate limiting:** `rateLimitBuckets` (fixed window в Convex), `lib/api-rate-limit.ts`, применяется в `middleware.ts` по IP только к выбранным маршрутам (auth, ai, lab, payments, lead-magnet). **`/api/v1/grants` не ограничен.** При сбое лимитер пропускает запросы (fail-open).
* **CORS:** `lib/api-cors.ts`, один глобальный список `CORS_ALLOWED_ORIGINS`; заголовок `X-API-Key` не разрешён.
* **Формат ошибок:** `{ success:false, error:{ message, code } }` без `request_id`; отличается от формата ТЗ.

### 1.2 Текущие endpoints, связанные с грантами

| Endpoint | Доступ | Замечание |
|---|---|---|
| `GET /api/v1/grants` | публичный | фильтры search/sector/country/donor/deadline, `limit` до **100**, без rate limit |
| `GET /api/v1/grants/{id}` | публичный | возвращает требования и донора |
| `GET /api/v1/donors`, `/plans`, `/stories`, `/health` | публичный | |
| Convex `grants.list`, `grants.getById`, `donors.list` | **публичные Convex-функции** | вызываются напрямую по `NEXT_PUBLIC_CONVEX_URL` в обход Next.js и любых лимитов |

### 1.3 Ветка ZOOMRAD (не слита в `main`)

Уже содержит партнёрский слой, который полезно переиспользовать:

* `lib/partners/partner-crypto.ts`: SHA-256 хеш токенов, HMAC с `timingSafeEqual`, защита от replay (nonce + timestamp), секреты только из env;
* `convex/partnersInternal.ts`, таблицы `partnerSessions`, `partnerRequestNonces`, `partnerMonthlyStats`;
* `lib/partners/revenue-share.ts`, `admin/reports/revenue-share`.

Но эта модель описывает **канал SSO + платежи внутри банковского приложения**, а не API-ключи для поставщика данных. Конфигурация каналов там частично в коде (`lib/partners/channels.ts`), а в ТЗ требуется хранить её в БД.

---

## 2. Что можно безопасно переиспользовать

| Компонент | Как используем |
|---|---|
| `rateLimitBuckets` + `convex/rateLimits.ts` | лимит в минуту по ключу `partner:{id}:min` (параметры берём из настроек партнёра) |
| `lib/api-route.ts` (паттерн обёрток) | новая обёртка `withPartner()` |
| `lib/api-cors.ts` | логика проверки Origin, но со списком доменов **из записи партнёра** |
| `partner-crypto.ts` (ветка ZOOMRAD) | хеширование API-ключей, сравнение за константное время |
| `convex/grants.ts` фильтры и пагинация | основа выборки, но с **отдельным белым списком полей** для партнёра |
| `userConsents` | образец версионирования текста согласия |
| `auditLogs` | запись админ-действий: выпуск и отзыв ключей, смена статуса лида |
| `accountErasure` (cron) | расширить на удаление и обезличивание лидов по запросу |
| Тестовая инфраструктура | convex-test для функций БД, node:test для хендлеров |

---

## 3. Обнаруженные риски

### Блокеры (решить до старта)

| # | Риск | Последствие | Предложение |
|---|---|---|---|
| B1 | **Production-каталог пуст** (`/api/v1/grants` → `total: 0` на 2026-07-13; сейчас недоступно для проверки из среды аудита) | партнёр увидит пустой раздел | выполнить `npm run convex:seed:prod` (нужен `CONVEX_DEPLOY_KEY`); затем наполнить реальными грантами, актуальными для Джизака, с проверенными источниками |
| B2 | **Каталог уже сейчас выгружается целиком**: публичный `/api/v1/grants` (limit 100, без rate limit) и публичные Convex-запросы | правило «партнёр не может выгрузить базу» бессмысленно, если базу может выгрузить кто угодно | см. §6.6: rate limit на публичный API, `limit` ≤ 50, перевести партнёрские поля в `internalQuery` |
| B3 | **Локализация персональных данных.** Закон РУз «О персональных данных» (ст. 27¹) требует хранить ПДн граждан РУз на серверах в Узбекистане. Convex и Vercel находятся за рубежом | юридический риск при сборе лидов (ФИО, телефон) | **нужна консультация юриста** до запуска. Варианты: (а) хранить ПДн лидов в базе на сервере в РУз; (б) хранить в Convex только обезличенный лид, а контакт держать в локальном хранилище или CRM; (в) принять риск на время пилота по решению юриста |
| B4 | **CI отключён** (GitHub billing lock), auto-deploy Vercel отключён | нет автоматической проверки безопасности перед релизом | снять billing lock |
| B5 | **Ветка ZOOMRAD не слита** и меняет `schema.ts`, `middleware.ts`, `package-lock.json` | конфликты при слиянии, если делать параллельно | решить: сначала слить ZOOMRAD, потом Partner API (рекомендуется), или отложить ZOOMRAD |

### Технические риски

| # | Риск | Решение в плане |
|---|---|---|
| T1 | **API-ключ нельзя хранить в браузере или мобильном приложении**: его легко извлечь. Ограничение по домену (Origin) и IP не защищает от вызовов с сервера | рекомендовать партнёру **server-to-server** интеграцию (его backend → наш API). Origin allowlist и CORS остаются дополнительной защитой. Если партнёр настаивает на вызовах из клиента, выдать отдельный «публичный» ключ только на чтение с жёстким лимитом, а лиды принимать только с серверного ключа |
| T2 | Поиск сейчас работает перебором в памяти (`matchesSearch`), полнотекстового индекса нет | добавить Convex `searchIndex` по денормализованному полю `searchText` |
| T3 | Модель гранта без полей uz/регион/теги/софинансирование/verified/published | аддитивная миграция (§5) |
| T4 | Rate limiter fail-open | для партнёрского API **fail-closed** на минутный лимит, fail-open только на месячный счётчик при сбое (с алертом) |
| T5 | ПДн в логах: `lead-magnet` пишет email в `console.info` | маскирование для всех новых логов; исправить `lead-magnet` |
| T6 | `x-forwarded-for` доверяется (нормально только на Vercel) | для IP allowlist использовать `x-real-ip` / `x-vercel-forwarded-for` от Vercel |
| T7 | Счётчики событий в одном документе дают конфликты записи в Convex | события пишутся отдельными документами, агрегаты считаются cron'ом раз в 5–15 минут |
| T8 | Формат ошибок ТЗ отличается от текущего | новый namespace с собственным форматом, существующий `/api/v1` не трогаем (на нём работает мобильное приложение) |
| T9 | ID в Convex имеют вид `k57…`, а в ТЗ `grant_12345` | публичный id: `grant_<convexId>` (обратимо, без миграции) + `slug` |
| T10 | Домены `api.fundingpro.uz` и `sandbox-api.fundingpro.uz` ещё не существуют | DNS + Vercel rewrites (§4.1) |

### Продуктовые и коммерческие риски

* Партнёрский лид с телефоном и без регистрации **не попадает ни в один текущий процесс FundingPro**. Нужно определить, кто и в какие сроки звонит лиду (SLA), иначе лиды «сгорают».
* «10% от первого оплаченного заказа» требует связать лид с будущей оплатой. Предлагается first-touch атрибуция: `referral_url` → регистрация → `users.referralLeadId` → первая успешная `payments` → комиссия (§5.6).
* Сумма в ТЗ указана в UZS, в текущих `successFeeRecords` используется USD. Комиссию храним в валюте платежа.

---

## 4. Архитектура решения

### 4.1 Маршрутизация

```
https://api.fundingpro.uz/v1/*          ─┐
                                          ├─ Vercel rewrite → /api/partner/v1/*  (тот же Next.js проект)
https://sandbox-api.fundingpro.uz/v1/*  ─┘   отдельный Vercel project/env → отдельный Convex deployment
```

* Партнёрский API живёт в **отдельном namespace** `app/api/partner/v1/**`, а не внутри существующего `/api/v1`. Это изолирует его от админки, AI, платежей и мобильного API.
* `middleware.ts`: для host `api.*` разрешены **только** пути `/v1/*` партнёрского API, всё остальное → 404.
* Sandbox — **отдельный Convex deployment** и отдельные env. Тестовый ключ физически не существует в production-БД. Дополнительно у ключа есть префикс: `fp_live_…` / `fp_test_…`; production отклоняет `fp_test_`.

### 4.2 Поток запроса

```
Partner backend ──X-API-Key──▶ withPartner()
   1. request_id (req_…)
   2. HTTPS only (Vercel) + отказ, если ключ пришёл в query string
   3. lookup sha256(key) → apiPartners  (status, expires, env)
   4. IP / Origin allowlist партнёра
   5. rate limit: 60/мин (fail-closed) + 5 000/мес
   6. Zod-валидация входа, лимиты длины
   7. handler → Convex internalQuery/internalMutation (только белый список полей)
   8. лог: partnerApiRequests (без ключа и ПДн)
   9. заголовки: X-Request-Id, X-RateLimit-*, Cache-Control
```

### 4.3 Принцип «белого списка»

Все ответы партнёру формируются отдельными функциями-мапперами `toPartnerGrant()` / `toPartnerGrantSummary()` в `lib/partner-api/serializers.ts`, а **не** через `...spread` документа. Тест (§8) проверяет, что ответ содержит **ровно** разрешённые ключи. `fit_score`, `isFeatured`, внутренние комментарии, `grantRequirements`, служебные id донора и т.п. наружу не попадают.

---

## 5. Изменения в модели данных (Convex)

Convex — документная БД без SQL-миграций. Изменения схемы применяются при `convex deploy`. Новые поля добавляются как `v.optional(...)`, затем заполняются скриптом backfill. Имена таблиц переведены в camelCase по конвенции проекта; соответствие таблицам из ТЗ указано в заголовках.

### 5.1 `grants`: новые поля (аддитивно)

| Поле | Тип | Назначение |
|---|---|---|
| `slug` | string, index | `green-innovation-grant-2027` |
| `titleUz`, `descriptionUz` | optional string | узбекская локаль |
| `summary`, `summaryRu`, `summaryUz` | optional string (≤ 500) | краткое описание для карточки (сейчас есть только длинное `description`) |
| `eligibleRegions` | optional string[] | `["Jizzakh","All Uzbekistan"]` |
| `tags` | optional string[] | |
| `fundingType` | optional string | grant / prize / fellowship / … |
| `cofinancingRequired`, `cofinancingPercentage` | optional bool / number | |
| `applicationLanguages` | optional string[] | |
| `publishedAt` | optional number | момент публикации |
| `lastVerifiedAt` | optional number | дата последней проверки источника |
| `verificationStatus` | optional `"verified" \| "unverified" \| "invalid"` | недостоверный → скрыт у партнёра |
| `partnerVisible` | optional bool (default false) | грант попадает в партнёрский API только после явной публикации |
| `consultationAvailable` | optional bool | → `fundingpro_consultation_available` |
| `searchText` | optional string + `searchIndex` | полнотекстовый поиск |

Индексы: `by_slug`, `by_partner_visible_status_deadline`, `searchIndex("search_grants", { searchField: "searchText", filterFields: ["partnerVisible","status"] })`.

`donors.type` (foundation / government / multilateral / corporate) добавляется опционально.

### 5.2 `apiPartners` (`api_partners`)

`partnerCode` (unique, напр. `jizzakh_business_platform`), `name`, `status` (`active|suspended|terminated`), `environment` (`production|sandbox`), `allowedDomains[]`, `allowedIps[]`, `allowedAppIds[]` (bundle id / package name), `monthlyRequestLimit`, `requestsPerMinute`, `maxPageSize`, `pilotStartedAt`, `pilotEndsAt`, `plan` (`pilot|free_for_leads|subscription|white_label`), `brandingRequired`, `commissionPercentage`, `commissionRule` (`first_paid_order`), `referralBaseUrl`, `contactEmail`, `notes`, timestamps.
Коммерческие условия хранятся **только здесь**, в коде их нет.

### 5.3 `apiPartnerKeys`

Отдельная таблица, чтобы можно было ротировать ключ без простоя: `partnerId`, `keyHash` (sha256, index), `keyPrefix` (первые 8 символов для поиска в UI), `environment`, `status` (`active|revoked`), `expiresAt`, `lastUsedAt`, `createdBy`, `revokedAt`, `revokedReason`.
Полный ключ показывается **один раз** при выпуске.

### 5.4 `partnerApiRequests` (`partner_api_requests`)

`partnerId`, `endpoint` (шаблон маршрута, без query), `method`, `statusCode`, `requestId`, `ipHash` (или маскированный IP), `responseTimeMs`, `errorCode?`, `createdAt`.
Индексы `by_partner_created`. Хранение: 90 дней, очистка cron'ом.
Не хранить: ключ, тела запросов, query-строки (в `search` пользователь может ввести что угодно).

### 5.5 `partnerEvents` (`partner_events`)

`partnerId`, `grantId?`, `externalUserId?` (хеш), `eventType` (union из 6 событий ТЗ), `sessionId?`, `utmSource/Medium/Campaign`, `isTest`, `createdAt`.
Лимиты длины на все строки, `occurredAt` принимается не старше 24 часов.

### 5.6 `partnerLeads` (`partner_leads`)

Все поля из ТЗ, а также:
`referralId` (`ref_…`), `source` (`partner_api`), `phoneNormalized` (E.164), `emailNormalized`, `dedupeKey` (hash(partnerId+grantId+phone|email)), `firstContactAt`, `lastContactAt`, `contactCount`, `status` (`new|contacted|qualified|proposal_sent|paid|rejected|closed|duplicate`), `assignedTo?` (админ), `convertedUserId?`, `paymentReceived`, `paymentAmount`, `paymentCurrency`, `isTest`, `consentTextVersion`, `consentAt`, `consentIp?` (хеш), `anonymizedAt?`.
Индексы: `by_dedupe_key_created`, `by_partner_status`, `by_partner_created`.

### 5.7 `partnerLeadEvents`

История лида: повторные обращения, смена статуса, заметки менеджера. Заметки не отдаются в публичный API.

### 5.8 `partnerIdempotencyKeys`

`partnerId`, `key` (UUID), `requestHash`, `responseLeadId`, `expiresAt` (24 ч). Повтор с тем же ключом и тем же телом возвращает тот же ответ. Тот же ключ с другим телом → `409 IDEMPOTENCY_CONFLICT`.

### 5.9 `partnerCommissions` (`partner_commissions`)

Поля из ТЗ + `paymentId`, `currency`. Создаётся **только** когда `payments.status = paid` у пользователя, связанного с лидом, и только для первого оплаченного заказа (правило берётся из `apiPartners.commissionRule`). Статусы: `pending|approved|paid|cancelled`.

### 5.10 `users`: новые поля

`referralPartnerId?`, `referralLeadId?`, `referralAttributedAt?` (first-touch, не перезаписывается).

### 5.11 `partnerMonthlyUsage` / `partnerDailyStats`

Агрегаты для аналитики и месячного лимита, пересчитываются cron'ом.

### Миграции

1. Deploy схемы с optional-полями (без простоя).
2. Скрипт `scripts/backfill-grant-partner-fields.mjs`: `slug`, `summary*` (из начала описания), `searchText`, `publishedAt = createdAt`, `lastVerifiedAt = lastUpdatedAt`, `partnerVisible = false`.
3. Ручная редакторская проверка: контент-менеджер отмечает `partnerVisible = true` и `lastVerifiedAt` для проверенных грантов.
4. Seed sandbox: 8–10 тестовых грантов + тестовый партнёр + тестовый ключ.

---

## 6. Endpoints партнёрского API

Базовый адрес `https://api.fundingpro.uz/v1`, авторизация `X-API-Key`.

| Метод | Путь | Описание | Кэш |
|---|---|---|---|
| GET | `/health` | без ключа; `status`, `version`, `timestamp` | no-store |
| GET | `/grants` | список: `page`, `limit` (≤ 50), `search`, `sector`, `applicant_type`, `country`, `region`, `funding_type`, `deadline_from`, `deadline_to`, `status`, `language`, `sort` (`deadline_asc`/`published_desc`) | `private, max-age=900` |
| GET | `/grants/search?q=` | полнотекстовый поиск по названию, описанию, донору, секторам, тегам, стране, типу заявителя | `max-age=900` |
| GET | `/grants/{grant_id}` | детальная карточка; закрытые и удалённые → `404 GRANT_NOT_FOUND` (или `status: closed` в пределах 30 дней после дедлайна) | `max-age=3600` |
| POST | `/leads` | приём лида, `Idempotency-Key` обязателен | no-store |
| POST | `/events` | событие (одно или батч до 50) | no-store |
| GET | `/meta/sectors`, `/meta/applicant-types` | справочники для фильтров | `max-age=86400` |

Чего **нет** в API: PUT/PATCH/DELETE для грантов, экспорт, CSV, доступ к лидам других партнёров, коммерческие поля, `fit_score`.

### 6.1 Правила выдачи грантов

Партнёр видит только гранты, где `partnerVisible = true`, `isActive = true`, `verificationStatus != invalid`, `status ∈ {open, upcoming}`, `deadline ≥ now` (или null).

### 6.2 Защита от массовой выгрузки

* `limit` ≤ 50; глубина пагинации ≤ 20 страниц (≤ 1 000 записей за один обход);
* 60 запросов в минуту, 5 000 в месяц;
* детектор аномалий: если за сутки партнёр запросил > 80% каталога, приходит алерт админу;
* `Cache-Control` + лицензия в документации запрещают постоянное локальное хранение.

### 6.3 Публичные признаки вместо `fit_score`

`flags`: `for_business`, `for_ngo`, `for_startup`, `available_in_uzbekistan`, `cofinancing_required`, `deadline_soon` (≤ 14 дней). Вычисляются из публичных полей.

### 6.4 Лиды

* обязательные поля проверяются Zod-схемой, лимиты длины (имя ≤ 120, сообщение ≤ 2 000 и т.д.);
* `consent_to_contact !== true` → `422 CONSENT_REQUIRED`, лид не создаётся и ПДн не логируются;
* `partner_id` в теле должен совпадать с партнёром ключа, иначе `403`;
* телефон нормализуется в E.164 (+998…), email в lower-case;
* дедупликация: тот же `dedupeKey` за 30 дней → новое событие `repeat_contact`, `lastContactAt` обновляется, возвращается существующий `lead_id` со `status: "existing"` (HTTP 200, а не 201). Ошибка `DUPLICATE_LEAD` используется только при конфликте idempotency;
* `referral_url` в ответе: `https://fundingpro.uz/apply?grant_id=…&partner_id=…&ref=ref_…` (без ПДн);
* уведомление менеджеру FundingPro (email или Telegram) о новом лиде, ПДн в тексте уведомления маскируются.

### 6.5 Формат ошибок

```json
{ "error": { "code": "INVALID_REQUEST", "message": "…", "request_id": "req_…" } }
```
Коды: `INVALID_API_KEY` (401), `EXPIRED_API_KEY` (401), `PARTNER_SUSPENDED` (403), `FORBIDDEN_ORIGIN` (403), `RATE_LIMIT_EXCEEDED` (429), `INVALID_REQUEST` (400), `CONSENT_REQUIRED` (422), `GRANT_NOT_FOUND` (404), `DUPLICATE_LEAD` (409), `IDEMPOTENCY_CONFLICT` (409), `INTERNAL_ERROR` (500).

### 6.6 Сопутствующие исправления существующего API (из-за B2)

* rate limit по IP на `GET /api/v1/grants*` и `/donors`;
* `limit` ≤ 50 в публичном каталоге;
* оценить перевод `grants.list` и `getById` в `internalQuery` с вызовом только с сервера (проверить, что мобильное приложение ходит через REST, а не напрямую в Convex);
* убрать email из `console.info` в `lead-magnet`.

---

## 7. Админка FundingPro (минимум для пилота)

* `/admin/partners`: список партнёров, создание, изменение лимитов и статуса (suspend/terminate), выпуск и отзыв ключа (ключ показывается один раз);
* `/admin/partner-leads`: таблица лидов, фильтр по `partner_id` и статусу, смена статуса, заметки, отметка оплаты;
* `/admin/partners/{id}/report?period=2026-11`: отчёт по формату ТЗ (`api_requests`, `grant_views`, `consultation_clicks`, `leads_submitted`, `qualified_leads`, `paid_clients`) + топ-10 грантов + переходы на официальный источник;
* `/admin/grants`: переключатель «Опубликовать для партнёров» + поле «Дата проверки».

Все админ-действия записываются в `auditLogs`. Отчёт для самого партнёра (без коммерческих полей) можно отдавать через `GET /v1/partner/stats` во второй версии; в пилоте он отправляется вручную.

---

## 8. Безопасность: чек-лист

| Требование ТЗ | Реализация |
|---|---|
| Ключ хранится как хеш | sha256 + 32 байта энтропии (`fp_live_` + base62); сравнение по индексу хеша |
| Отзыв / срок действия | `apiPartnerKeys.status`, `expiresAt`; проверка на каждый запрос (без кэша > 60 с) |
| prod / sandbox | отдельный Convex deployment и env, префиксы ключей |
| HTTPS only | Vercel + HSTS; ключ в query → 400 |
| Rate limiting | минутный (fail-closed) + месячный |
| IP / domain restrictions, CORS | allowlist из записи партнёра; `X-API-Key` в `Access-Control-Allow-Headers` только для разрешённых Origin |
| Логи без ПДн | только метаданные; хелпер `maskPii()` для любых `console.*` |
| SQL injection | Convex не использует SQL; все входы валидируются Zod, строки ограничены по длине |
| Повторная отправка | `Idempotency-Key` + дедупликация 30 дней |
| Секреты | только env (`PARTNER_API_KEY_PEPPER` и т.п.), `.env.example` без значений; проверка git-хуком или Semgrep |
| ПДн не в URL | лиды только в теле POST; в `referral_url` только непрозрачный `ref_…` |
| Право на удаление | расширить `accountErasure`: обезличивание лида по телефону/email, срок хранения лида без конверсии 12 месяцев |
| Немедленная приостановка | `status = suspended` → все ключи партнёра сразу отклоняются |

---

## 9. Тестирование

**Unit / интеграционные (convex-test + node:test):**
действующий / недействующий / истёкший / отозванный ключ; приостановленный партнёр; sandbox-ключ в production; фильтры (sector, applicant_type, region, deadline_from/to, status, language, sort); `limit > 50` → 50; глубина пагинации; закрытый, просроченный и непроверенный грант не виден; отсутствующий грант → 404; поиск по каждому из 7 полей; создание лида; отсутствие согласия; отсутствие телефона и email; несовпадение `partner_id`; повторный лид за 30 дней и через 31 день; idempotency (тот же ключ + то же тело / другое тело); rate limit 61-й запрос → 429; месячный лимит; CORS (разрешённый / чужой Origin, preflight); **snapshot «ровно эти ключи»** для гранта и лида (нет внутренних полей); партнёр A не видит события и лиды партнёра B; referral: лид → регистрация → оплата → комиссия 10% только для первого оплаченного заказа; `is_test` лиды не попадают в production-отчёт; маскирование ПДн в логах.

**Контрактные:** ответы валидируются против `openapi.yaml` (например, через `openapi-response-validator`) в CI.

**E2E:** cURL-сценарий из README на sandbox (`scripts/partner-api-smoke.mjs`).

**Нагрузка:** короткий прогон 60 rpm × 5 мин (k6 или autocannon) против sandbox.

---

## 10. Документация (поставляется партнёру)

`docs/partner-api/`:
`openapi.yaml` (OpenAPI 3.1) · `README.md` (быстрый старт за 15 минут) · `.env.example` · `examples/curl.md` · `examples/typescript.ts` (fetch-клиент с retry по `Retry-After`) · `FundingPro-Partner-API.postman_collection.json` · `errors.md` · `sandbox.md` · `personal-data.md` (согласие, текст v1.0 на uz/ru, сроки хранения, удаление) · `branding.md` (обязательная плашка «Grant data powered by FundingPro», ссылка на источник, дата проверки, дисклеймер «сверяйте с официальным объявлением»; варианты на uz/ru/en) · `caching.md`.

Документацию можно также опубликовать на `api.fundingpro.uz/docs` (Scalar или Redoc из `openapi.yaml`).

---

## 11. Этапы и сроки

Оценка для одного разработчика, работающего с AI-ассистентом. Сроки указаны в рабочих днях, без учёта ожидания решений.

| Этап | Содержание | Дни |
|---|---|---|
| **0. Подготовка** | B1–B5: seed каталога, GitHub billing, решение по ZOOMRAD, ответ юриста по ПДн, DNS `api.` / `sandbox-api.` | 1–3 (зависит от вас) |
| **1. Модель данных** | схема (§5), backfill, админ-переключатель `partnerVisible`, наполнение uz-полей | 3 |
| **2. Ядро партнёрского доступа** | `apiPartners`, ключи, `withPartner()`, rate limits, логирование, CORS/IP, ошибки, host-routing | 4 |
| **3. Гранты** | `/grants`, `/grants/{id}`, `/grants/search`, сериализаторы, кэш-заголовки, search index | 3 |
| **4. Лиды и события** | `/leads` (валидация, согласие, дедупликация, idempotency), `/events`, уведомление менеджеру | 4 |
| **5. Админка и аналитика** | партнёры, ключи, лиды, отчёт, комиссии, атрибуция `users.referral*` | 4 |
| **6. Sandbox** | отдельный deployment, seed, тестовый партнёр, `is_test` | 2 |
| **7. Документация** | OpenAPI, README, примеры, Postman, правила ПДн и бренда | 3 |
| **8. Тесты и security review** | §9, исправление существующего публичного API (§6.6), ревью | 3 |
| **9. Запуск пилота** | выпуск sandbox-ключа → интеграция партнёра → production-ключ | 2 + время партнёра |

**Итого: около 27–30 рабочих дней (5–6 недель), а с параллельной подготовкой и быстрыми решениями около 4–5 недель.** После этого 30 дней пилота.

**Минимальный вариант (≈ 2 недели):** этапы 1–4 + sandbox-seed + OpenAPI/README. Админка в этом варианте сводится к списку лидов, а отчёт по партнёру собирается SQL-подобным скриптом вручную.

---

## 12. Решения, нужные от владельца продукта

1. Сливать ли сначала ветку ZOOMRAD (рекомендуется) или отложить её.
2. Где хранить ПДн лидов (B3): нужно мнение юриста.
3. Кто в FundingPro обрабатывает партнёрские лиды и за какое время (SLA, например, 24 часа).
4. Интеграция партнёра: только server-to-server (рекомендуется) или также из мобильного приложения.
5. Какие гранты публикуются партнёру в пилоте: все проверенные или только релевантные для Джизака и бизнеса.
6. Полный или минимальный вариант (§11).
