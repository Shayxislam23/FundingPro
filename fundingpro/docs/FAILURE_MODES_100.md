# 100 причин провала FundingPro

Снимок: **2026-07-13**. Использовать как weekly risk board: топ-10 открытых → owner + due date.

Связано: [`STARTUP_SURVIVAL_PLAN.md`](./STARTUP_SURVIVAL_PLAN.md), [`ACCESS_NEEDED.md`](../../ACCESS_NEEDED.md), admin `/admin/funnel` (North Star).

## Как закрывать

| Кластер | P0 antidote |
|---------|-------------|
| 1, 51–52, 99 | `CONVEX_DEPLOY_KEY` → `npm run convex:seed:prod` |
| 41, 57–59 | billing + paste-secrets + Vercel Git |
| 2, 27, 29, 97 | North Star в `/admin/funnel` + PostHog `north_star_*` |
| 81–83 | Apple/Google accounts + screenshots |

---

## A. Продукт и рынок (1–35)

1. Пустой каталог на проде — нечего продавать сегодня.
2. Нет доказанного outcome loop (подача заявки), только checklist.
3. AI-черновик без гарантии качества → доверие рушится после 1-й генерации.
4. Eligibility «на глаз» vs реальные требования донора.
5. Pivot физлица, а seed/гранты всё ещё NGO-heavy (частично закрыто в seedData).
6. Конкуренция с бесплатными базами грантов / Telegram-каналами.
7. Слабый WTP: «зачем платить за поиск».
8. Нет repeatable channel (SEO/ads/партнёры не доказаны).
9. Unit economics неизвестны при `PAYMENTS_ENABLED=false`.
10. Длинный цикл заявки vs ожидание «быстрого AI-результата».
11. Сертификаты/менторы soft — легко подделать ценность.
12. Mentor supply bottleneck.
13. Success fee плохо enforced / legally weak.
14. Сегмент «все физлица Узбекистана» слишком широкий.
15. Нет niche beachhead (студенты / IT / женщины / регион).
16. Язык RU/UZ/EN без полной локализации.
17. Trust: новый бренд vs UNDP/GIZ «оригиналы».
18. Регуляторика грантов/персональных данных Узбекистан.
19. Refunds/complaints без process maturity.
20. Churn после первого месяца подписки.
21. Feature bloat (lab, consultants, admin, 3 PSP) без PMF.
22. Dashboard пустой → «продукт сломан» narrative.
23. Mobile vs web split attention.
24. Store delay → нет mobile acquisition.
25. No network effects / marketplace liquidity.
26. Data moat отсутствует (каталог копируем).
27. Wrong KPI (pageviews vs submitted apps).
28. Founder distraction (awards/docs vs users).
29. Pilot без 20% application proof (свой же критерий).
30. Pricing too high for students / too low for B2B later.
31. No sales motion for universities/NGOs later.
32. Referral program never activated.
33. Content marketing thin vs competitors.
34. Seasonal grant cycles → revenue volatility.
35. Narrative «AI platform» commodity in 2026.

## B. GTM, бренд, доверие (36–50)

36. `fundingpro.app` (Netlify) vs `.uz` (Vercel) путает SEO/trust.
37. Health endpoint с юрлицом без живого каталога = empty shell branding.
38. No social proof / case studies with real wins.
39. App Store rejection (privacy/deletion/metadata).
40. Play rejection (Data Safety / incomplete links).
41. Deep links hijack risk while App Links incomplete (M-02).
42. Brand look generic AI SaaS.
43. Overpromise in landing vs delivery.
44. Support-only deletion feels half-baked to Apple.
45. No clear competitor differentiation slide.
46. Partnerships with donors never closed.
47. Press/awards focus without users.
48. Domain email / deliverability issues (Resend misconfig).
49. Analytics not wired → flying blind.
50. Telegram digest never scheduled → no owned channel.

## C. Технология и архитектура (51–80)

51. Production DB empty until manual seed — deploy ≠ ready.
52. `PUBLIC_API_SEED_FALLBACK` off in prod → hard empty, not soft demo.
53. Seed NGO types mismatch individuals-first UI (mitigated: `withIndividualsFirst` in seedData).
54. `ignoreBuildErrors` — **removed 2026-07-13** after typecheck green; regression risk if re-added.
55. ESLint during builds: prefer CI lint gate over ignoring forever.
56. Vercel Root Directory ambiguity → broken monorepo installs.
57. Git auto-deploy disconnected → main ≠ live.
58. Dual vercel project IDs / stale `funding-pro.vercel.app` 404.
59. GitHub Actions billing lock → no automated quality gate.
60. Release Gate never runs → regressions to prod.
61. Clerk JWT misconfig → Convex 401 silent failures.
62. Middleware skips API auth → reliance on each route (miss one = leak).
63. Rate limits need `CONVEX_DEPLOY_KEY` — without it weaker buckets.
64. AI rate limits vs cost explosion if OpenAI bills spike.
65. AI mock fallback teaches bad data.
66. No cert pinning (M-03 accepted) → MITM on hostile networks.
67. Account erasure incomplete without Clerk auto-delete.
68. Payments multi-PSP complexity before one works.
69. Webhook signature bugs → free premium / chargebacks.
70. `PAYMENTS_ENABLED` flip without sandbox → money loss.
71. Convex OCC conflicts under load on hot paths.
72. `.collect()` regressions despite audits.
73. Schema drift mobile `api-types` vs web.
74. Workspace package inline vs packages/ dual source of truth.
75. Next.js rewrites / `.well-known` break on framework upgrade.
76. CSP/`unsafe-inline` residual XSS surface.
77. Secrets in wrong env (preview vs production).
78. No pen-test before payments go-live.
79. Dependabot PRs fail CI → dependency rot.
80. Expo/RN upgrade treadmill breaks EAS builds.

## D. Mobile, ops, исполнение (81–100)

81. Never pays Apple $99 / Google $25 → no store.
82. EAS CLI not installed / credentials missing.
83. Screenshots never taken → listing incomplete.
84. Version stuck 0.4.0 forever / premature 1.0.0 without QA.
85. Maestro optional in CI → UI regressions.
86. Deep link open-in-app never verified on device.
87. Push tokens / notifications unused → retention death.
88. Offline/poor network UX for UZ mobile users untested.
89. Single founder bus factor.
90. Docs sprawl (`fundingpro-1/`, pilot 2/3/4) → wrong playbook used.
91. Human blockers treated as «agent will finish» forever.
92. No on-call / incident runbook practiced.
93. Staging ≈ prod missing → test in production.
94. Cost: Clerk + Convex + Vercel + AI + PSP fees without revenue.
95. Legal PD registry / offer pages lag before scale.
96. Mentor verification soft → certificate fraud risk.
97. Success metric not instrumented in PostHog/Plausible (events exist; dashboards optional).
98. Team builds features instead of seeding data.
99. False green health API masks empty catalog.
100. **Compound failure:** empty inventory + payments off + no CI + no store + no outcome metric = silent death while dashboard looks «professional».
