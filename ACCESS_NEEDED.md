# ACCESS_NEEDED — что нужно от тебя для полного запуска

Обновлено: 2026-07-08 | Статус проверен агентом автоматически.

---

## Текущий live-статус

| Компонент | Статус | Детали |
|---|---|---|
| **fundingpro.uz** | ✅ LIVE | 200 OK, Next.js SSR работает, Vercel READY |
| `www.fundingpro.uz/.well-known/apple-app-site-association` | ⚠️ LIVE но неполный | 200 OK, Content-Type: application/json ✅, но `X-App-Links-Config: incomplete` |
| `www.fundingpro.uz/.well-known/assetlinks.json` | ⚠️ LIVE но неполный | 200 OK ✅, но `X-App-Links-Missing: ANDROID_RELEASE_SHA256` |
| `fundingpro.uz` → `www.fundingpro.uz` | ✅ OK | 307 redirect — это штатное поведение Vercel (primary domain = www). Приложение настроено на `www.fundingpro.uz` |
| GitHub Actions CI | ❌ startup_failure | Все runs падают за 0 сек — см. Блокер #3 |
| Vercel GitHub auto-deploy | ⚠️ Отключён | Деплои идут через Vercel CLI вручную; GitHub webhook-интеграция не активна |
| EAS CLI | ❌ Не установлен | `eas` не найден на машине |

---

## Секреты/доступы, которые нужно добавить тебе

### 🔐 1. APPLE_TEAM_ID → Vercel Production

**Откуда взять:**
1. Войди на [developer.apple.com/account](https://developer.apple.com/account)
2. Раздел **Membership** → поле **Team ID** (10 символов, например `AB12CD34EF`)

**Как добавить (Vercel Dashboard):**
```
Vercel → Project fundingpro → Settings → Environment Variables
  Имя:  APPLE_TEAM_ID
  Значение: <твой 10-символьный Team ID>
  Среды: ✅ Production
```

**Как добавить через CLI:**
```bash
vercel env add APPLE_TEAM_ID production
# вставить значение когда спросит
```

**После добавления — нужен редеплой:**
```bash
cd fundingpro
vercel --prod
```

---

### 🔐 2. ANDROID_RELEASE_SHA256 → Vercel Production

**Откуда взять:**  
Это SHA-256 fingerprint сертификата подписи APK/AAB для production.

**Вариант A — из EAS (если уже собирал production build):**
```bash
npm install -g eas-cli
eas credentials --platform android
# в секции "Upload Keystore" → отобразится SHA-256
```

**Вариант B — из Play Console:**
Play Console → Выбрать приложение → Setup → App signing → **SHA-256 certificate fingerprint**

**Вариант C — если есть keystore-файл локально:**
```bash
keytool -list -v -keystore your-key.jks -alias your-alias | grep "SHA256:"
```

**Как добавить:**
```bash
vercel env add ANDROID_RELEASE_SHA256 production
# вставить значение (формат: AA:BB:CC:... или AABB... без двоеточий — оба ок)
```

**После добавления — нужен редеплой:**
```bash
cd fundingpro
vercel --prod
```

---

### 🔐 3. GitHub Actions: оплата или смена плана

**Проблема:** Все GitHub Actions runs в репозитории `Shayxislam23/FundingPro` (private) падают с `startup_failure` за 0 секунд. Это характерный симптом **исчерпания 2 000 free-минут/месяц** для приватного репозитория на GitHub Free.

**Варианты исправления (выбери один):**

**Вариант A — Сделать репозиторий публичным (0 руб., мгновенно):**
> ⚠️ Перед этим убедись, что в коде нет секретов или чувствительных данных (проверь `.gitignore`, `.env` не закоммичен).
```
GitHub → FundingPro → Settings → Danger Zone → Change repository visibility → Public
```
Публичные репо получают **неограниченные** бесплатные Actions-минуты.

**Вариант B — Купить GitHub Actions minutes:**
```
GitHub → Settings → Billing → Add payment method → Buy Actions minutes
($4 за 1 000 min) 
```

**Вариант C — Перейти на GitHub Team ($4/user/месяц):**
```
GitHub → Settings → Billing → Upgrade plan
```
Даёт 3 000 min/месяц для приватных репо.

---

### 🔐 4. Apple Developer Account ($99/год) + App Store Connect

Нужно **только для сабмита в App Store**. Без этого приложение собирается и работает как dev-клиент.

| Что нужно | Где взять |
|---|---|
| Apple Developer Program | [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) |
| Создать App Record в ASC | App Store Connect → Apps → + → New App |
| `ascAppId` (числовой) | ASC → App → App Information → Apple ID |
| `appleTeamId` | developer.apple.com → Membership → Team ID (тот же, что для APPLE_TEAM_ID) |

---

### 🔐 5. Google Play Developer Account ($25 единоразово) + Service Account

Нужно **только для сабмита в Google Play**. 

| Что нужно | Где взять |
|---|---|
| Play Developer Account | [play.google.com/apps/publish](https://play.google.com/apps/publish) |
| Создать приложение в Play Console | Play Console → Все приложения → Создать приложение |
| **Первый AAB нужно загрузить вручную** | Play Console → Production → Загрузить `.aab` (EAS submit не работает без первой ручной загрузки) |
| Service Account JSON | Play Console → Настройка → API-доступ → Создать служебный аккаунт |

---

## Команды для запуска после добавления секретов

```bash
# 1. Проверить App Links после редеплоя
cd fundingpro
npm run app-links:check -- --live

# 2. Проверить живые endpoints вручную
curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association \
  | grep "X-App-Links"
# Ожидаемый результат: заголовок X-App-Links-Config отсутствует

curl -sI https://www.fundingpro.uz/.well-known/assetlinks.json \
  | grep "X-App-Links"

# 3. Собрать production build мобильного приложения (нужен EAS)
npm install -g eas-cli
cd mobile
eas build --platform all --profile production

# 4. Сабмит в сторы (после шагов 4 и 5 выше)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Что агент уже сделал автоматически

| Действие | Результат |
|---|---|
| Проверил live-статус всех .well-known endpoints | ✅ Структура правильная, AASA и assetlinks отдают 200 |
| Проверил, что `app.json` настроен на `www.fundingpro.uz` | ✅ `associatedDomains` и `intentFilters` корректны |
| Попытался запустить GitHub Actions вручную (`workflow_dispatch`) | ❌ startup_failure (см. Блокер #3) |
| Проверил Vercel проект через MCP | ✅ Деплой READY, домены привязаны |
| Проверил live-сайт (HTML, Clerk, Next.js) | ✅ Сайт полностью работает |
| Диагностировал причину CI startup_failure | ❌ Исчерпаны GitHub Actions минуты |
| Обновил документацию | ✅ Этот файл |
