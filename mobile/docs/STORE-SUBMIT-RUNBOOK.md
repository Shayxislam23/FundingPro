# Как выпустить FundingPro в App Store и Google Play

Операторский runbook: от аккаунтов разработчика до Live. Каталог сабмитов Expo: [fundingpro/submissions](https://expo.dev/accounts/shayxislam/projects/fundingpro/submissions). Документация: [EAS Submit](https://docs.expo.dev/submit/introduction/), [Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/).

**Коротко:** `eas build` собирает бинарник → `eas submit` загружает его в консоль стора → **человек** заполняет листинг и нажимает Review. `eas submit` **не** публикует приложение в продакшен сам.

| Платформа | Что делает `eas submit` | Что остаётся в консоли |
|-----------|-------------------------|------------------------|
| iOS | Загружает `.ipa` в App Store Connect → через 10–15 мин билд в **TestFlight** | Метаданные, скриншоты, выбрать билд, **Submit for Review** |
| Android | Загружает `.aab` на трек **internal** со статусом **draft** | Листинг, Data safety, промоут internal → production, **отправить на проверку** |

Текущая версия в репо: **0.4.0** (`app.json`). Store-релиз **1.0.0** — только после QA на устройстве (`STORE-LAUNCH.md`). Bundle / package: `uz.fundingpro.app`. Expo project: `shayxislam` / `fundingpro` (`57edb446-5583-4f1a-9540-6b812beb5467`).

Смежные файлы: [`STORE-SUBMISSION-PLAN.md`](./STORE-SUBMISSION-PLAN.md) (статус-борд), [`STORE-LISTING-COPY.md`](./STORE-LISTING-COPY.md) (тексты), [`APP-PRIVACY-DATA-SAFETY.md`](./APP-PRIVACY-DATA-SAFETY.md) (формы), [`EAS-SUBMIT-CREDENTIALS.md`](./EAS-SUBMIT-CREDENTIALS.md) (ID в `eas.json`).

---

## 0. Что уже в коде vs что только человек

Уже в репозитории: `eas.json` production-профиль, listing copy, privacy answers, associated domains / intent filters, in-app deletion, review notes.

Только человек (агент не может): оплата Apple ($99/год) и Google ($25 разово), создание черновиков в консолях, скриншоты с устройства, кнопки Review / Publish.

Перед командами:

```bash
npm i -g eas-cli
eas login          # аккаунт shayxislam
cd mobile
npm run store:preflight
```

---

## 1. Аккаунты разработчика

1. [Apple Developer Program](https://developer.apple.com/programs/enroll) — $99/год, **организация**, не случайный личный аккаунт.
2. [Google Play Console](https://play.google.com/apps/publish/signup/) — $25 разово.

Без этого `eas submit` некуда загружать бинарник.

---

## 2. Черновики приложений в консолях

### App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com/) → Apps → **+** → New App.
2. Bundle ID: `uz.fundingpro.app` (должен совпасть с Identifiers в Apple Developer).
3. Скопируйте **Apple ID** (число, не bundle) из App Information — это `ascAppId`.
4. Team ID: [Membership](https://developer.apple.com/account) → Team ID (10 символов) — это `appleTeamId` и Vercel `APPLE_TEAM_ID`.

Впишите оба значения в `mobile/eas.json` → `submit.production.ios` (см. [`EAS-SUBMIT-CREDENTIALS.md`](./EAS-SUBMIT-CREDENTIALS.md)).

### Google Play Console

1. Play Console → **Создать приложение** → application ID `uz.fundingpro.app`.
2. Пакеты: **AAB**, не APK. Production-профиль EAS уже собирает `.aab`.
3. Создайте [Google Service Account](https://github.com/expo/fyi/blob/main/creating-google-service-account.md) и выдайте ему доступ в Play Console (хотя бы «Release to testing tracks»).
4. Загрузите JSON-ключ в EAS (предпочтительно, ключ не в git):

```bash
cd mobile
eas credentials --platform android
# production → Google Service Account → Upload a Google Service Account Key
```

Либо локально: `mobile/secrets/play-service-account.json` (gitignored) и поле `serviceAccountKeyPath` в `eas.json`.

С июля 2026 Expo: **первый релиз можно создать через `eas submit`** на internal track, если приложение уже есть в Play Console и service account загружен. Ручная загрузка AAB — запасной путь ([manual Android](https://docs.expo.dev/submit/android-manual/)), не жёсткое требование.

---

## 3. Credentials и секреты сборки

```bash
cd mobile
eas secret:list
```

Обязательно на project:

| Secret | Значение |
|--------|----------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | **production** Clerk (`pk_live_…`, не `pk_test_`) |
| `EXPO_PUBLIC_API_URL` | уже в `eas.json` production env: `https://www.fundingpro.uz/api/v1` |

iOS для CI / `--non-interactive`: App Store Connect API Key через `eas credentials --platform ios` → **Set up your project to use an API Key for EAS Submit**. Интерактивно достаточно Apple ID.

После Team ID и SHA-256 релизного keystore: Vercel Production `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256`, затем `npx vercel --prod` из `fundingpro/` и `npm run app-links:check -- --live`. Не сабмитьте в Review, пока live `/.well-known/*` не 200 без `X-App-Links-Config: incomplete`.

SHA-256 после первой подписи:

```bash
eas credentials --platform android
# production → credentials → fingerprint
```

---

## 4. Production build

```bash
cd mobile
eas build --profile production --platform all
```

Или по платформам:

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

Сборка + загрузка одним шагом (после шага 2):

```bash
eas build --profile production --platform ios --auto-submit
eas build --profile production --platform android --auto-submit
```

`autoIncrement: true` + `appVersionSource: remote` поднимают iOS build number / Android versionCode на стороне EAS. Строку версии (`0.4.0` → `1.0.0`) меняйте в `app.json` и `package.json` только после QA.

Статус: [expo.dev builds](https://expo.dev/accounts/shayxislam/projects/fundingpro/builds).

---

## 5. Submit (загрузка бинарника)

```bash
cd mobile
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

Последний успешный билд: добавьте `--latest`. Конкретный билд: `--id <EAS_BUILD_UUID>`.

Либо вручную из каталога `mobile/`:

```bash
eas workflow:run submit-ios.yml
eas workflow:run submit-android.yml
```

Логи: [submissions](https://expo.dev/accounts/shayxislam/projects/fundingpro/submissions).

Ожидаемый результат:

- iOS → TestFlight (ещё не App Store).
- Android → internal / **draft** (ещё не production, ещё не Review).

---

## 6. Листинг, формы, скриншоты

Вставьте из репо:

| Что | Откуда |
|-----|--------|
| Название, описание, keywords | [`STORE-LISTING-COPY.md`](./STORE-LISTING-COPY.md) |
| App Privacy / Data Safety | [`APP-PRIVACY-DATA-SAFETY.md`](./APP-PRIVACY-DATA-SAFETY.md) |
| Скриншоты (7 экранов) + Play feature graphic 1024×500 | [`STORE-LAUNCH.md`](./STORE-LAUNCH.md) |
| Review notes + demo-аккаунт | [`STORE-LAUNCH.md`](./STORE-LAUNCH.md) |

URL: Privacy `https://www.fundingpro.uz/legal/privacy` · Terms `https://www.fundingpro.uz/legal/offer` · Support `support@fundingpro.uz`.

---

## 7. Отправка на ревью (консоли)

### iOS → App Store

1. Дождитесь обработки билда в TestFlight.
2. Прогоните QA на физическом устройстве (гейты в `STORE-LAUNCH.md`).
3. При необходимости bump `version` → `1.0.0`, новый `eas build` + `eas submit`.
4. App Store Connect → версия → выбрать билд TestFlight → **Submit for Review**.

### Android → Play

1. Дозаполните листинг, Data safety, content rating, target audience.
2. Internal testing: добавьте тестеров, при необходимости смените `releaseStatus` с `draft` на `completed` в консоли или в `eas.json` для следующего сабмита.
3. Продвиньте релиз **internal → closed/open → production** и отправьте на проверку Google.

Первый production-релиз Google обычно проверяет дольше, чем обновление.

---

## 8. После Live

- Обновите [`RELEASE.md`](./RELEASE.md) и [`mobile/CHANGELOG.md`](../CHANGELOG.md), тег `v1.0.0`.
- Следующие нативные изменения: снова `eas build` + `eas submit`. JS-only можно позже через EAS Update (пока не подключён — не используйте вместо стор-релиза).
- Следующие сабмиты Android можно оставить на `internal` + promote, либо сменить `track` на `production` в `eas.json` когда процесс стабилен.

---

## Типичные ошибки

| Симптом | Что сделать |
|---------|-------------|
| `ascAppId` / invalid app | Черновик в App Store Connect и числовой Apple ID в `eas.json` |
| Play API 403 / no permission | Service account приглашён в Play Console с правом на релизы; ключ загружен в EAS |
| `eas submit` просит первый пакет | Создайте приложение в Play Console; при необходимости один раз загрузите AAB вручную |
| Placeholder `REPLACE_AFTER_*` в `eas.json` | Не коммитьте фейковые ID — CLI уйдёт в интерактив или упадёт в CI |
| TestFlight есть, в сторе нет | Нужна кнопка **Submit for Review** в App Store Connect |
| Android draft «висит» | Это ожидаемо: `releaseStatus: draft` — завершите релиз в Play Console |
| Review: нет demo login | Clerk production review-аккаунт + notes из `STORE-LAUNCH.md` |
| Review: нет удаления аккаунта | Profile → «Запросить удаление аккаунта» |
| App Links incomplete | Vercel `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` |

Команды справки:

```bash
eas build:list
eas submit:list
eas build:version:get
```
