# ACCESS_NEEDED — что нужно от тебя для полного запуска

Обновлено: **2026-07-13** | Live verify после попытки prod seed; human unblock ниже.

---

## Текущий live-статус (2026-07-13)

| Компонент | Статус | Детали |
|---|---|---|
| **www.fundingpro.uz** | ✅ LIVE | Health `ok`, DB ok, AI ok, **payments.enabled: false** |
| Landing / product | ✅ OK | Individuals-first copy на проде |
| `/api/v1/plans` | ❌ Пусто | `total: 0` — Convex production **не засеян** |
| `/api/v1/grants` | ❌ Пусто | `total: 0` |
| `/.well-known/apple-app-site-association` | ⚠️ Неполный | 200 OK · `X-App-Links-Config: incomplete` · нужны `APPLE_TEAM_ID`, `ANDROID_RELEASE_SHA256` |
| `/.well-known/assetlinks.json` | ⚠️ Неполный | То же |
| `fundingpro.uz` → `www.fundingpro.uz` | ✅ OK | 307 redirect — штатное поведение Vercel |
| GitHub Actions CI (`main-ci.yml`) | ❌ BILLING LOCK | Проверено **2026-07-13** — runs `29224989839`, `29224847321` (~4–5s): *account locked due to a billing issue* |
| GitHub Release Gate (`release-gate.yml`) | ❌ BILLING LOCK | `29224761180` (push main), `29218435343` (schedule) — то же |
| Ghost workflow `BuildFailed` | 🗑️ Удалён | id 306385397 — отключи уведомления (см. §3) |
| GitHub repo visibility | ✅ Public | Public не снимает billing lock на аккаунте |
| Vercel GitHub auto-deploy | ⚠️ Отключён | Reconnect в Vercel Dashboard — Root Directory **`.`** (рекомендуется) или `fundingpro` (см. §3b). CLI deploy работает. |
| Convex prod seed | ❌ BLOCKED | `npm run convex:seed:prod` → нет `CONVEX_DEPLOY_KEY` в shell / `fundingpro/.env.production.local` |
| EAS CLI | ❌ Не установлен | `eas` не найден на машине |

**Критичный gap:** сайт живой, но каталог тарифов/грантов пустой. После успешного seed ожидается ~6 plans и grants > 0 (см. `fundingpro/docs/PROD-SEED.md`).

---

## Чеклист для тебя (human, параллельно)

1. **Convex prod seed** — добавить `CONVEX_DEPLOY_KEY` и запустить seed (см. §0 ниже).
2. **GitHub billing** — [settings/billing](https://github.com/settings/billing) — снять lock, иначе CI/Release Gate не стартуют.
3. **`bash paste-secrets.sh`** — `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` на Vercel → App Links complete.
4. **Vercel ↔ GitHub reconnect** — Root Directory `.` — auto-deploy с `main`.
5. **Apple $99 + Google $25** — store accounts / listings (см. §4–5).

---

### ⚡ 0. CONVEX_DEPLOY_KEY → production seed ← продуктовый приоритет

Без этого `/api/v1/plans` и `/api/v1/grants` остаются пустыми.

1. Convex Dashboard → **production** deployment → **Settings** → **Deploy Key** → создать/скопировать.
2. Добавить в `fundingpro/.env.production.local` (файл **не** коммитить):

```bash
CONVEX_DEPLOY_KEY="prod:…your-key…"
```

3. Из корня монорепо:

```bash
npm run convex:seed:prod
```

4. Проверка:

```bash
curl -s https://www.fundingpro.uz/api/v1/plans | head -c 500
curl -s "https://www.fundingpro.uz/api/v1/grants?limit=1" | head -c 300
# Ожидание: plans ~6, grants total > 0
```

Полная инструкция: [`fundingpro/docs/PROD-SEED.md`](fundingpro/docs/PROD-SEED.md).

**Статус 2026-07-13:** ключ в локальных env **отсутствует** — агент seed не смог выполнить.

---

## Секреты/доступы, которые нужно добавить тебе

### ⚡ БЫСТРЫЙ СТАРТ App Links — 30 секунд

Открой терминал в корне проекта и запусти:
```bash
bash paste-secrets.sh
```
Скрипт спросит 2 значения, добавит их на Vercel и запустит редеплой.

---

### 🔐 1. APPLE_TEAM_ID → Vercel Production

**Откуда взять:**
1. Войди на [developer.apple.com/account](https://developer.apple.com/account)
2. Раздел **Membership** → поле **Team ID** (10 символов, например `AB12CD34EF`)

**Ручной способ:**
```bash
cd fundingpro
npx vercel env add APPLE_TEAM_ID production
# вставить значение когда спросит, затем:
npx vercel --prod
```

---

### 🔐 2. ANDROID_RELEASE_SHA256 → Vercel Production

**Откуда взять:**

**Вариант A — из Play Console:**
Play Console → Выбрать приложение → Setup → App signing → **SHA-256 certificate fingerprint**

**Вариант B — из EAS:**
```bash
npm install -g eas-cli
eas credentials --platform android
```

**Вариант C — из keystore-файла:**
```bash
keytool -list -v -keystore your-key.jks -alias your-alias | grep "SHA256:"
```

**Ручной способ:**
```bash
cd fundingpro
npx vercel env add ANDROID_RELEASE_SHA256 production
npx vercel --prod
```

**Проверка после редеплоя:**
```bash
curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association | grep -i x-app-links
curl -sI https://www.fundingpro.uz/.well-known/assetlinks.json | grep -i x-app-links
# Ожидаемый результат: `x-app-links-config: incomplete` и `x-app-links-missing` ОТСУТСТВУЮТ
```

---

### 🔐 3. GitHub Actions — BILLING LOCK ← блокер автоматики

**Реальная причина:** Аккаунт GitHub (`Shayxislam23`) **заблокирован по биллингу**. Сообщение в CI: `"The job was not started because your account is locked due to a billing issue."`

**Что было сделано агентом:**
- ✅ Репозиторий переведён в **public** (неограниченные минуты для публичных репо)
- ❌ Но это не помогло — аккаунт заблокирован целиком

**Что нужно сделать тебе:**
```
GitHub → Settings → Billing & plans → 
  Проверить неоплаченные счета / добавить платёжный метод
  URL: https://github.com/settings/billing
```

После разблокировки биллинга CI должен заработать сразу (репо уже public).

**Последняя проверка (2026-07-13):** Dependabot CI `29224989839` и Release Gate `29224761180` падают за ~4–5s с billing lock — биллинг **ещё заблокирован**.

**Проверка после разблокировки:**
```bash
gh workflow run main-ci.yml --ref main
gh workflow run release-gate.yml --ref main
sleep 10
gh run list --limit 3
gh run view <latest-run-id>
```

**Уведомления:** ghost workflow `BuildFailed` удалён. Если письма с пустым именем workflow продолжаются — GitHub → Settings → Notifications → отключить failed workflows for deleted.

---

### 🔐 3b. Vercel ↔ GitHub reconnect (автодеплой main)

Merge в `main` не обновляет prod, пока Git integration отключена. **На 2026-07-13 это по-прежнему актуально.**

**Если OAuth «Connect GitHub» в Vercel не открывается / падает:** сначала переподключи GitHub в [github.com/settings/applications](https://github.com/settings/applications) → Authorized OAuth Apps → Vercel → Grant (или Revoke + заново Connect в Vercel). Альтернатива без dashboard OAuth: deploy вручную `cd fundingpro && npx vercel --prod --yes` после каждого merge (см. `fundingpro/docs/DOMAIN-STRATEGY.md`).

**Пошагово в Vercel Dashboard:**

1. [vercel.com](https://vercel.com) → Project **fundingpro** → Settings → **Git**
2. **Disconnect** старую интеграцию (если есть «broken» link)
3. **Connect Git Repository** → GitHub → авторизуй `Shayxislam23/FundingPro` (нужен repo admin)
4. Production Branch: `main`
5. **Root Directory** — выбери один вариант (оба работают; см. `fundingpro/docs/DOMAIN-STRATEGY.md`):

| Root Directory | vercel.json | installCommand | Когда использовать |
|---|---|---|---|
| **`.` (корень репо)** — рекомендуется | `vercel.json` в корне | `npm ci` | Git reconnect: полный clone, lockfile в корне |
| `fundingpro` | `fundingpro/vercel.json` | `npm install` | Текущий CLI deploy; **не** используй `cd .. && npm ci` — родительский lockfile не попадает в bundle |

6. Save → **Deployments** → убедись, что новый deploy из `main` пошёл автоматически
7. Fallback без Git: `cd fundingpro && npx vercel --prod --yes`

**Домены:** canonical prod = `www.fundingpro.uz`. Не используй `fundingpro.app` (legacy Netlify) или `funding-pro.vercel.app` для smoke/CI — см. `fundingpro/docs/DOMAIN-STRATEGY.md`.

**Post-merge verify (локально):**
```bash
cd fundingpro
PROD_BASE_URL=https://www.fundingpro.uz node scripts/production-content-check.mjs
SMOKE_BASE_URL=https://www.fundingpro.uz npm run test:smoke
npm run app-links:check -- --live
```

---

### 🔐 3c. GitHub repo secret (опционально) — `SMOKE_BASE_URL_PROD`

Используется в `main-ci.yml` (production-deploy-check) и `release-gate.yml`. По умолчанию оба workflow берут `https://www.fundingpro.uz`.

**Когда задавать:** если prod временно на другом URL или нужен staging gate.

```
GitHub → Repo Settings → Secrets and variables → Actions → New repository secret
Name: SMOKE_BASE_URL_PROD
Value: https://www.fundingpro.uz
```

Локальная проверка App Links:
```bash
cd fundingpro
SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
# Ожидаем fail пока нет APPLE_TEAM_ID / ANDROID_RELEASE_SHA256 — см. paste-secrets.sh
```

---

### 🔐 4. Apple Developer Account ($99/год) + App Store Connect

Нужно **только для сабмита в App Store**.

| Что нужно | Где взять |
|---|---|
| Apple Developer Program | [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) |
| Создать App Record в ASC | App Store Connect → Apps → + → New App |
| `ascAppId` (числовой) | ASC → App → App Information → Apple ID |
| `appleTeamId` | developer.apple.com → Membership → Team ID (тот же, что APPLE_TEAM_ID) |

---

### 🔐 5. Google Play Developer Account ($25 единоразово) + Service Account

Нужно **только для сабмита в Google Play**.

| Что нужно | Где взять |
|---|---|
| Play Developer Account | [play.google.com/apps/publish](https://play.google.com/apps/publish) |
| Создать приложение в Play Console | Play Console → Все приложения → Создать приложение |
| **Первый AAB нужно загрузить вручную** | Play Console → Production → Загрузить `.aab` |
| Service Account JSON | Play Console → Настройка → API-доступ → Создать служебный аккаунт |

---

## Команды для запуска после добавления секретов

```bash
# 0. Prod catalog seed (нужен CONVEX_DEPLOY_KEY)
npm run convex:seed:prod

# 1. Проверить App Links после редеплоя
curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association | grep -i x-app-links
# Ожидаемый результат: строк x-app-links-missing и x-app-links-config нет

# 2. Собрать production build мобильного приложения (нужен EAS)
npm install -g eas-cli
cd mobile
eas build --platform all --profile production

# 3. Сабмит в сторы (после шагов 4 и 5 выше)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Что агент уже сделал автоматически

| Действие | Результат |
|---|---|
| Проверил live-статус .well-known / health / plans / grants (2026-07-13) | ✅ Health OK; App Links incomplete; **plans=0, grants=0** |
| Попытка `npm run convex:seed:prod` | ❌ Нет `CONVEX_DEPLOY_KEY` — seed не выполнен |
| Проверил CI / Release Gate (2026-07-13) | ❌ BILLING LOCK подтверждён |
| Проверил, что `app.json` настроен на `www.fundingpro.uz` | ✅ `associatedDomains` и `intentFilters` корректны |
| Перевёл репозиторий в **public** | ✅ Сделано 2026-07-08 |
| Создал `SECRETS_TO_PASTE.env.example` + `paste-secrets.sh` | ✅ |
| Проверил live-сайт (HTML, Clerk, Next.js) | ✅ Сайт работает; каталог пуст до seed |
