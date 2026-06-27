# Отчёт о security-аудите FundingPro

> **Стек (июнь 2026):** Next.js 15, **Convex** (БД + server functions), **Clerk** (auth), Vercel. Исторический блок про Supabase/PostgreSQL (24.06.2026) сохранён ниже для архива; рекомендации про RLS и `SUPABASE_SERVICE_ROLE_KEY` **не применимы** к текущей архитектуре.

**Дата обновления:** 27 июня 2026  
**Объект:** FundingPro — https://www.fundingpro.uz  
**Методология:** 817 cybersecurity skills (orchestrator) + static/domain checks + dynamic probes  

---

## Резюме для руководства (Convex era)

| Метрика | Значение |
|---------|----------|
| **Findings (machine-readable)** | **0** — нет открытых Medium/High/Critical |
| **API routes** | 64 files — `withActiveUser`: 28, `withAdmin`: 18, `withPublic`: 9, `withPaymentWebhook`: 1, `merchant`: 8 |
| **npm audit (prod gate)** | **0 high** — Next 15.5.19 + Clerk 7.5.9 (см. SECURITY-ROADMAP) |
| **Skills coverage** | 837 skills mapped — см. [`skills-matrix.json`](security-audit/skills-matrix.json) |

**Закрытые Medium findings (audit 88→96):**

| ID | Remediation |
|----|-------------|
| API-CUSTOM-AUTH | Merchant routes classified; `withPublic` on lead-magnet, payments/status; `withPaymentWebhook` on webhook — [`API-SECURITY.md`](./API-SECURITY.md) |
| EDGE-API-BYPASS | Middleware edge rate limits on AI, auth, lead-magnet, payments/status, webhook, PSP callbacks |
| AI-RATE-LIMIT-MEMORY | Production denies when Convex unavailable; dev-only memory fallback |
| CORS-UNENFORCED | `lib/api-cors.ts` integrated into all `api-route` wrappers |

**Ops blockers (не code findings):** M-02 App Links live verification, PSP sandbox E2E, external pen-test — [`OPS-RUNBOOK.md`](./OPS-RUNBOOK.md). In-repo scripts ready (`npm run ops:readiness`).

---

## Артефакты аудита

| Файл | Описание |
|------|----------|
| [`docs/API-SECURITY.md`](./API-SECURITY.md) | 64-route matrix, merchant auth, CORS, rate limits |
| [`docs/security-audit/findings.json`](security-audit/findings.json) | 0 активных findings |
| [`docs/security-audit/skills-matrix.json`](security-audit/skills-matrix.json) | Матрица 837 skills |
| [`docs/security-audit/threat-model.md`](security-audit/threat-model.md) | STRIDE threat model |
| [`docs/PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) | External pen-test scope |
| [`scripts/security-audit-orchestrator.mjs`](../scripts/security-audit-orchestrator.mjs) | Orchestrator |
| [`scripts/ops-readiness.mjs`](../scripts/ops-readiness.mjs) | In-repo ops gate (O1–O4) |

**Запуск:**

```bash
cd fundingpro
npm run security:audit      # static + domain → findings.json (CI: SECURITY_AUDIT_FAIL_MEDIUM=1)
npm run security:probe      # local probes
npm run security:probe:prod # production (read-only)
npm run ops:readiness       # deploy + app-links + payments dry-run
node scripts/convex-collect-audit.mjs  # .collect() gate
```

---

## API inventory

| Wrapper | Count | Notes |
|---------|-------|-------|
| `withActiveUser` | 28 | User-scoped CRUD, AI, documents |
| `withAdmin` | 18 | Admin catalog, payments ledger |
| `withPublic` | 9 | Health, plans, legal, public reads |
| `withPaymentWebhook` | 1 | Deprecated webhook stub |
| **merchant** | 8 | PSP callbacks (Payme, Click, Uzum) |

Полная матрица 64 маршрутов: [`API-SECURITY.md`](./API-SECURITY.md).

---

## CI gates (audit 88→96)

| Gate | Location |
|------|----------|
| Convex `.collect()` audit | `ci.yml` web job — `node scripts/convex-collect-audit.mjs` |
| Security orchestrator (0 Medium+) | `ci.yml` security job — `SECURITY_AUDIT_FAIL_MEDIUM=1 npm run security:audit` |
| GitHub Actions SHA pin | `actions/checkout@34e1148…`, `actions/setup-node@49933ea…` |
| Health prod leak test | `tests/health.test.mjs` |

---

## Устранённые / mitigated (2026)

| ID | Статус | Notes |
|----|--------|-------|
| AI-RATE-LIMIT-MEMORY | **Resolved** | Convex `rateLimitBuckets`; prod denies without backend |
| NPM-AUDIT-HIGH | **Resolved** | Next 15.5.19 pin; 0 high at prod gate |
| HEADERS-MISSING | **Resolved** | CSP/HSTS in `next.config.mjs` |
| CORS-UNENFORCED | **Resolved** | `lib/api-cors.ts` in api-route wrappers |
| EDGE-API-BYPASS | **Mitigated** | Edge rate limits on sensitive API paths |
| CI-ACTIONS-MUTABLE-TAGS | **Resolved** | Actions pinned to SHA digests |
| ADMIN-CHECK-NO-STATUS | **Resolved** | `withActiveUser` on admin-check |
| HEALTH-ERROR-LEAK | **Resolved** | `buildHealthPayload` omits dbError in production |
| SUPABASE-* | **N/A** | Stack migrated to Convex |
| Rate limiting Track 6.2 | **Resolved** | Middleware + Convex buckets |

---

## Backlog remediation (приоритет)

1. **P1:** M-02 — Vercel App Links env + live check + device smoke → mark Resolved
2. **P1:** O4 — PSP sandbox E2E on preview before `PAYMENTS_ENABLED=true`
3. **P2:** External pen-test — [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)
4. **P3:** Narrow `v.any()` on `convex/matchGrants.ts` profile arg

---

## Ops readiness (O1–O4) — manual steps required

Scripts and docs are in-repo; **live dashboard access required** to close ops items:

| ID | In-repo | Manual (operator) |
|----|---------|-------------------|
| O1 | `deploy:check`, `deploy:env` | Set Vercel Production env vars, redeploy |
| O2 | `convex:codegen`, deploy docs | `npx convex deploy` with `CONVEX_DEPLOY_KEY` |
| O3 | `app-links:check` | `--live` against production + device smoke |
| O4 | `payments:golive`, sandbox scripts | PSP webhook registration, sandbox E2E, flip `PAYMENTS_ENABLED` |

Run `npm run ops:readiness` for the full checklist.

---

## Заключение

FundingPro прошёл skills-driven аудит с актуальным Convex/Clerk стеком. **0 open findings** в `findings.json`. Основной launch risk — **ops verification** (App Links, payments sandbox, pen-test), не блокирующий code defects.

**Threat model:** [`security-audit/threat-model.md`](security-audit/threat-model.md)  
**Machine-readable findings:** [`security-audit/findings.json`](security-audit/findings.json)  
**Incident response:** [`OPS-RUNBOOK.md#incident-response`](./OPS-RUNBOOK.md#incident-response)  
**Pen-test:** [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)

---

## Архив: Supabase-era audit (24 июня 2026)

<details>
<summary>Исторический отчёт (Supabase, RLS, service role) — click to expand</summary>

Проведён системный аудит эпохи Supabase: 57 API-маршрутов, RLS inventory, dynamic probes.

**Критическая уязвимость (RLS)** — устранена миграцией `20250623210000_rls_hardening_public_schema.sql`.

**Были High:** `SUPABASE_SERVICE_ROLE_KEY` missing, npm audit high, `ADMIN_BYPASS_DEV` — последние два закрыты; Supabase items N/A после миграции на Convex.

Production probes (legacy): `/plans` 500 из-за schema drift на Supabase — **не актуально** для Convex.

</details>
