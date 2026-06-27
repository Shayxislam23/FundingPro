# Отчёт о security-аудите FundingPro

> **Стек (июнь 2026):** Next.js 15, **Convex** (БД + server functions), **Clerk** (auth), Vercel. Исторический блок про Supabase/PostgreSQL (24.06.2026) сохранён ниже для архива; рекомендации про RLS и `SUPABASE_SERVICE_ROLE_KEY` **не применимы** к текущей архитектуре.

**Дата обновления:** 27 июня 2026  
**Объект:** FundingPro — https://www.fundingpro.uz  
**Методология:** 817 cybersecurity skills (orchestrator) + static/domain checks + dynamic probes  

---

## Резюме для руководства (Convex era)

| Метрика | Значение |
|---------|----------|
| **Findings (machine-readable)** | **6** — Medium: 4, Low: 2 |
| **API routes** | 64 files — `withActiveUser`: 27, `withAdmin`: 18, `withPublic`: 7, custom: 12 |
| **npm audit (prod gate)** | **0 high** — Next 15.5.19 + Clerk 7.5.9 (см. SECURITY-ROADMAP) |
| **Skills coverage** | 817 skills mapped — см. [`skills-matrix.json`](security-audit/skills-matrix.json) |

**Главные остаточные риски:**

| Приоритет | ID | Тема |
|-----------|-----|------|
| Medium | API-CUSTOM-AUTH | 12 payment/marketing routes без стандартных wrappers — см. [`API-SECURITY.md`](./API-SECURITY.md) |
| Medium | EDGE-API-BYPASS | Middleware пропускает `/api/*` — mitigated rate-limit на AI/auth |
| Medium | AI-RATE-LIMIT-MEMORY | In-memory fallback если нет `CONVEX_DEPLOY_KEY` в prod |
| Medium | CORS-UNENFORCED | `CORS_ALLOWED_ORIGINS` не применяется (Track 6.7) |
| Low | CI-ACTIONS-MUTABLE-TAGS | GitHub Actions `@v4` без SHA pin |
| Low | HEALTH-ERROR-LEAK | dbError в health (non-prod only) |

`ADMIN-CHECK-NO-STATUS` отсутствует в последнем прогоне orchestrator — перезапустите `npm run security:audit` после изменений auth routes.

**Ops blockers (не code findings):** M-02 App Links live verification, PSP sandbox E2E, external pen-test — [`OPS-RUNBOOK.md`](./OPS-RUNBOOK.md).

---

## Артефакты аудита

| Файл | Описание |
|------|----------|
| [`docs/API-SECURITY.md`](./API-SECURITY.md) | Route wrappers, custom auth matrix, Convex patterns |
| [`docs/security-audit/findings.json`](security-audit/findings.json) | 6 активных findings |
| [`docs/security-audit/skills-matrix.json`](security-audit/skills-matrix.json) | Матрица 817 skills |
| [`docs/security-audit/threat-model.md`](security-audit/threat-model.md) | STRIDE threat model |
| [`docs/PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) | External pen-test scope |
| [`scripts/security-audit-orchestrator.mjs`](../scripts/security-audit-orchestrator.mjs) | Orchestrator |
| [`scripts/ops-readiness.mjs`](../scripts/ops-readiness.mjs) | In-repo ops gate |

**Запуск:**

```bash
cd fundingpro
npm run security:audit      # static + domain → findings.json
npm run security:probe      # local probes
npm run security:probe:prod # production (read-only)
npm run ops:readiness       # deploy + app-links + payments dry-run
```

---

## API inventory

| Wrapper | Count | Notes |
|---------|-------|-------|
| `withActiveUser` | 27 | User-scoped CRUD, AI, documents |
| `withAdmin` | 18 | Admin catalog, payments ledger |
| `withPublic` | 7 | Health, plans, legal, public reads |
| Custom | 12 | PSP callbacks, admin-check, lead-magnet |

Custom routes — обоснованы merchant auth или публичным read-only status. Полная матрица: [`API-SECURITY.md`](./API-SECURITY.md).

---

## Устранённые / mitigated (2026)

| ID | Статус | Notes |
|----|--------|-------|
| AI-RATE-LIMIT-MEMORY | **Resolved in prod** | Convex `rateLimitBuckets` when `CONVEX_DEPLOY_KEY` set |
| NPM-AUDIT-HIGH | **Resolved** | Next 15.5.19 pin; 0 high at prod gate |
| HEADERS-MISSING | **Resolved** | CSP/HSTS in `next.config.mjs` |
| SUPABASE-* | **N/A** | Stack migrated to Convex |
| Rate limiting Track 6.2 | **Resolved** | Middleware + Convex buckets |

---

## Backlog remediation (приоритет)

1. **P1:** M-02 — Vercel App Links env + live check + device smoke → mark Resolved
2. **P1:** O4 — PSP sandbox E2E on preview before `PAYMENTS_ENABLED=true`
3. **P2:** Audit/document 12 custom API routes (partially done in API-SECURITY.md)
4. **P2:** Enforce `CORS_ALLOWED_ORIGINS` (Track 6.7)
5. **P2:** Pin GitHub Actions to SHA digests
6. **P3:** Narrow `v.any()` on `convex/matchGrants.ts` profile arg
7. **P3:** External pen-test — [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)

---

## Заключение

FundingPro прошёл skills-driven аудит с актуальным Convex/Clerk стеком. **6 findings** (4 Medium, 2 Low), без Critical/High в `findings.json`. Основной launch risk — **ops verification** (App Links, payments sandbox, pen-test), не блокирующий code defects.

**Threat model:** [`security-audit/threat-model.md`](security-audit/threat-model.md)  
**Machine-readable findings:** [`security-audit/findings.json`](security-audit/findings.json)  
**Incident response:** [`OPS-RUNBOOK.md#incident-response`](./OPS-RUNBOOK.md#incident-response)

---

## Архив: Supabase-era audit (24 июня 2026)

<details>
<summary>Исторический отчёт (Supabase, RLS, service role) — click to expand</summary>

Проведён системный аудит эпохи Supabase: 57 API-маршрутов, RLS inventory, dynamic probes.

**Критическая уязвимость (RLS)** — устранена миграцией `20250623210000_rls_hardening_public_schema.sql`.

**Были High:** `SUPABASE_SERVICE_ROLE_KEY` missing, npm audit high, `ADMIN_BYPASS_DEV` — последние два закрыты; Supabase items N/A после миграции на Convex.

Production probes (legacy): `/plans` 500 из-за schema drift на Supabase — **не актуально** для Convex.

</details>
