# FundingPro Mobile — App Store / Play Store Launch (v1.0.0)

Checklist for **store submission** after preview builds and Maestro smoke pass. Technical release steps live in [`RELEASE.md`](./RELEASE.md).

**Current version:** `0.4.0` (RC). **Target store release:** `1.0.0` — bump only after TestFlight/preview sign-off (see [Version path](#version-path-to-v100) below).

---

## Pre-submit gates

| Gate | Doc / command |
|------|----------------|
| Clay UI verified on device | [`CLAY-VERIFY.md`](./CLAY-VERIFY.md) |
| EAS preview builds installable | [`EAS-PREVIEW.md`](./EAS-PREVIEW.md) |
| Maestro smoke (local) | `maestro test mobile/maestro/` |
| Prod catalog + API | `npm run convex:seed:prod` (root) |
| Deep links on device | `fundingpro://auth/callback`, `fundingpro://subscription/return` |
| App Links (production) | Real Apple Team ID + Android SHA-256 in web `.well-known` |

---

## Screenshots checklist

Capture on **physical device** or simulator at **6.7" iPhone** and **Phone (1080×1920)** Android after [`CLAY-VERIFY.md`](./CLAY-VERIFY.md).

| # | Screen | RU caption idea | Notes |
|---|--------|-----------------|-------|
| 1 | Public landing | «Гранты для бизнеса и молодёжи Узбекистана» | Hero + «Публичные гранты» CTA |
| 2 | Grants catalog | «Поиск и фильтры грантов» | At least one grant card visible |
| 3 | Home dashboard | «Ваш прогресс и заявки» | Stats + onboarding checklist if incomplete |
| 4 | Opportunities Lab | «Путь к гранту за 10 шагов» | Journey progress bar + next-action card |
| 5 | AI writer | «AI-черновик заявки» | Disclosure visible |
| 6 | Subscription | «Тарифы и оплата» | Payment consent checkbox + plan cards |
| 7 | Profile | «Профиль» | Account deletion link visible |

**App Store Connect:** 6.7", 6.5", 5.5" if required; **Play Console:** phone + 7" tablet optional.

Export PNG, no status bar clutter, light mode (app default).

---

## App Review notes (paste into Connect / Play)

```
Demo account (Clerk development — review builds only):
  Email: review+clerk_test@fundingpro.uz  (or e2e+clerk_test@example.com on dev)
  OTP: 424242 (Clerk test mode — no email delivery)

Sign-in: Email OTP only (no social login required).

Payments: Uzum / card checkout may be disabled in review build (PAYMENTS_ENABLED=false).
  Subscription screen still shows plan list and payment terms consent.

Account deletion: Profile → «Запросить удаление аккаунта» (support ticket; backend erasure planned).

AI: In-app disclosure at Dashboard → AI → «Раскрытие AI».

Opportunities Lab: More → «Opportunities Lab» — 10-step guided onboarding for
youth/business applicants (self-report progress, no payment involved).

Legal URLs (live):
  Privacy: https://www.fundingpro.uz/legal/privacy
  Terms:   https://www.fundingpro.uz/legal/offer
  Payment: https://www.fundingpro.uz/legal/payment-terms
```

Adjust demo email if you create a dedicated App Store Connect test user in Clerk production.

---

## Demo account setup

1. **Clerk (review instance):** enable Email verification code; add redirect `fundingpro://auth/callback`.
2. **Test OTP:** `+clerk_test` suffix + `424242` on **development** instances only ([Clerk test emails](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)).
3. **Backend:** ensure `EXPO_PUBLIC_API_URL` points to seeded prod/staging with plans and public grants.
4. **Onboarding smoke:** Maestro `onboarding-checklist.yaml` expects **incomplete** onboarding for the test user; reset or use a fresh test account.
5. **Do not** ship `pk_test_` keys in production store builds — use production Clerk + real review account for final submit.

---

## Maestro flows (CI + local)

All flows live in [`mobile/maestro/`](../maestro/). See [`maestro/README.md`](../maestro/README.md).

| Flow | Purpose |
|------|---------|
| `public-grants.yaml` | Public catalog navigation |
| `auth-login.yaml` | Clerk email OTP → «Главная» |
| `onboarding-checklist.yaml` | Home onboarding card |
| `subscription-consent.yaml` | Subscription payment terms consent |

CI runs Maestro when CLI is available; full execution needs `MAESTRO_APP_PATH` to a simulator `.app` (optional, `continue-on-error`).

---

## Version path to v1.0.0

Do **not** bump version until Track 1 exit criteria are met:

1. Preview/TestFlight build signed off on physical devices (auth, grants, deep links).
2. Store screenshots + metadata drafted from this doc.
3. Maestro smoke green on dev client locally.
4. App Links placeholders replaced with real Team ID / SHA-256 (web deploy).
5. Production EAS profile + submit:

```bash
cd mobile
# Edit app.json + package.json version → 1.0.0
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

Update [`RELEASE.md`](./RELEASE.md) and [`CHANGELOG.md`](../CHANGELOG.md) when tagging v1.0.0.

---

## Related docs

- [`RELEASE.md`](./RELEASE.md) — build commands, compliance, deep links
- [`EAS-PREVIEW.md`](./EAS-PREVIEW.md) — preview profile smoke
- [`CLAY-VERIFY.md`](./CLAY-VERIFY.md) — UI gate before screenshots
- [`SECURITY.md`](./SECURITY.md) — secrets and auth notes
