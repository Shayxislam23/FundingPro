# Отчёт о security-аудите FundingPro

> **Обновление (июнь 2026):** Backend мигрирован с Supabase/PostgreSQL на **Convex + Clerk**. Ниже — исторический отчёт аудита эпохи Supabase (24.06.2026). Актуальный стек: Convex (БД + server functions), Clerk (auth), Vercel (Next.js). Рекомендации про RLS, `SUPABASE_SERVICE_ROLE_KEY` и Supabase Auth **не применимы** к текущей архитектуре; см. `lib/auth/admin-access.ts` и Convex custom functions для access control.

**Дата:** 24 июня 2026  
**Объект (на момент аудита):** FundingPro (Next.js 14, Supabase, Vercel) — https://www.fundingpro.uz  
**Текущий стек:** Next.js 14, Convex, Clerk, Vercel  
**Методология:** 817 cybersecurity skills (Anthropic-Cybersecurity-Skills) через orchestrator + ручной code review + динамические пробы (local + production) + Supabase MCP advisors  

---

## Резюме для руководства

Проведён системный аудит безопасности приложения FundingPro: статический анализ кода и CI, проверка 57 API-маршрутов, инвентаризация RLS в Supabase, динамические пробы против local stack и production, доменные проверки (AI, платежи Uzum, загрузка файлов), STRIDE threat model.

**Критическая уязвимость (RLS на public schema)** — устранена миграцией `20250623210000_rls_hardening_public_schema.sql`, применённой на remote Supabase.

**Остаются приоритетные риски:**

| Приоритет | Кол-во | Главные темы |
|-----------|--------|--------------|
| High | 3 | Отсутствует `SUPABASE_SERVICE_ROLE_KEY` в Vercel; npm audit (4 high); флаг `ADMIN_BYPASS_DEV` |
| Medium | 7 | 12 custom-auth API routes; middleware не охватывает `/api/*`; AI rate limit in-memory; upload через admin storage; CORS; Supabase Auth (SMTP, leaked passwords) |
| Low | 4 | Mutable GitHub Actions tags; admin-check без проверки banned; dev-only anon fallback (mitigated) |

**Покрытие 817 skills:** EXECUTED 32 · ADAPTED 600 · N/A 161 · TOOL_BLOCKED 24 — см. [`docs/security-audit/skills-matrix.json`](security-audit/skills-matrix.json).

---

## Область и окружения

| Среда | URL / идентификатор | Что проверялось |
|-------|---------------------|-----------------|
| Код | `fundingpro/` | Auth, API, SQL, AI gateway, payments |
| Local | `:3099`, Docker Postgres `:5433` | BOLA, auth matrix, headers (16/16 probes) |
| Production | https://www.fundingpro.uz | Read-only probes (13/16; см. ниже) |
| Supabase | `xgvwfnfifzsgscwvtcnz` | Advisors, RLS inventory, migration |
| CI | `.github/workflows/ci.yml` | Lint, tests, `security:audit`, npm audit |

---

## Артефакты аудита

| Файл | Описание |
|------|----------|
| [`docs/security-audit/skills-matrix.json`](security-audit/skills-matrix.json) | Матрица 817 skills |
| [`docs/security-audit/findings.json`](security-audit/findings.json) | 14 findings с severity и remediation |
| [`docs/security-audit/threat-model.md`](security-audit/threat-model.md) | STRIDE threat model |
| [`scripts/security-audit-orchestrator.mjs`](../scripts/security-audit-orchestrator.mjs) | Orchestrator |
| [`scripts/security-api-probe.mjs`](../scripts/security-api-probe.mjs) | Dynamic API probes |

**Запуск локально:**

```bash
cd fundingpro
npm run security:audit      # static + domain + matrix
npm run security:probe      # local probes
npm run security:probe:prod # production (read-only)
```

---

## Устранённые находки (remediated)

### Critical — RLS disabled на public tables (SUPABASE-RLS-HARDENING)

**Было:** 24+ таблиц в `public` без Row Level Security; anon key PostgREST мог читать/писать чувствительные данные.

**Сделано:** Миграция `20250623210000_rls_hardening_public_schema.sql` — RLS включён, политики для public read (grants, plans, donors), user-scoped (applications, documents), admin-only таблиц.

### Medium — Security headers (HEADERS-MISSING)

**Сделано:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy в [`next.config.mjs`](../next.config.mjs). **Требуется production redeploy** для появления заголовков на www.fundingpro.uz.

### High — Anon fallback для service role (AUTH-SERVICE-ROLE-FALLBACK)

**Сделано:** [`lib/supabase-server.ts`](../lib/supabase-server.ts) — fail-fast в `NODE_ENV=production` без `SUPABASE_SERVICE_ROLE_KEY`.

### Low — Uzum Basic auth timing

**Сделано:** `timingSafeEqual` в [`lib/payments/uzum-auth.ts`](../lib/payments/uzum-auth.ts).

### CI hardening

**Сделано:** шаги `security:audit` и `npm audit` в CI; `.gitleaks.toml`; Semgrep rules в `.semgrep/`.

---

## Активные findings

### High

| ID | Описание | Remediation |
|----|----------|-------------|
| SUPABASE-SERVICE-ROLE-MISSING | Service role key не задан в Vercel production | Dashboard → API Keys → добавить `SUPABASE_SERVICE_ROLE_KEY`, redeploy |
| NPM-AUDIT-HIGH | 4 high, 1 moderate в npm dependencies | `npm audit fix`, обновить Next/transitive deps |
| ADMIN-DEV-BYPASS | Флаг `ADMIN_BYPASS_DEV` в admin-access | Никогда не задавать в production env |

### Medium

| ID | Описание | Remediation |
|----|----------|-------------|
| API-CUSTOM-AUTH | 12 маршрутов без `withPublic`/`withActiveUser`/`withAdmin` | Построчный audit: health, plans, legal, lead-magnet, payments/* |
| EDGE-API-BYPASS | Middleware пропускает `/api/*` | Defense in depth: edge rate-limit или auth pre-check |
| AI-RATE-LIMIT-MEMORY | In-memory fallback rate limit на serverless | Только `rate_limit_buckets` в production |
| UPLOAD-ADMIN-STORAGE | Upload через admin client | User-scoped client + server-side ownership check |
| CORS-UNENFORCED | `CORS_ALLOWED_ORIGINS` не применяется | Middleware или route-level CORS |
| SUPABASE-AUTH-LEAKED-PASSWORDS | HaveIBeenPwned protection выключен | Supabase Dashboard → Auth → Password security |
| SUPABASE-SMTP-MANUAL | Resend SMTP не в Supabase Auth | Dashboard → Auth → SMTP (smtp.resend.com:465) |

### Low

| ID | Описание | Статус |
|----|----------|--------|
| AUTH-SERVICE-ROLE-DEV-FALLBACK | Anon fallback только в dev | mitigated |
| CI-ACTIONS-MUTABLE-TAGS | `@v4` без SHA pin | Рекомендуется pin digest |
| ADMIN-CHECK-NO-STATUS | admin-check без banned/disabled | Review |
| HEALTH-ERROR-LEAK | dbError в health (non-prod) | mitigated-in-prod |

---

## Динамическое тестирование

### Local (16/16 passed)

Auth boundaries, BOLA negative tests, CORS reflection, security headers — все пробы успешны после build с новым `next.config.mjs`.

### Production (13/16 passed)

| Probe | Результат | Причина |
|-------|-----------|---------|
| GET `/api/v1/plans` → 200 | FAIL (500) | **Schema drift:** remote `plans` (legacy: `segment`, `code`, `status`) ≠ app schema (`name`, `target_type`, `is_active`) |
| Security headers на `/` | FAIL | Старый deploy без `next.config.mjs` headers |
| Остальные (health, grants, auth-negative, CORS) | PASS | — |

**Рекомендация по `/plans`:** применить миграцию выравнивания schema или адаптировать `listPlans()` под legacy; добавить `SUPABASE_SERVICE_ROLE_KEY` для admin paths.

---

## API inventory (57 routes)

| Wrapper | Count |
|---------|-------|
| `withActiveUser` | 25 |
| `withAdmin` | 18 |
| `withPublic` | 2 |
| Custom (manual auth) | 12 |

Custom routes требуют явного обоснования публичности или merchant auth — см. `findings.json` → `customRoutes`.

---

## SQL injection

Ручной review + static scan: все `pool.query` в `lib/db/` используют параметризацию (`$1`, `$2`). Supabase `.or()` filter strings — не raw SQL; ложные срабатывания устранены в orchestrator.

---

## AI security

- Prompt injection surface: `/api/v1/ai/proposal/generate`, `/api/v1/ai/match-grants`
- [`lib/ai-gateway.ts`](../lib/ai-gateway.ts): sanitization, redaction
- Rate limit: DB-backed + in-memory fallback (Medium finding на serverless)

---

## Payments (Uzum)

- `PAYMENTS_ENABLED=false` на production (health probe)
- Basic auth на merchant routes; timing-safe compare добавлен
- Webhook routes — custom auth; требуют review при включении payments

---

## Compliance

- `user_consents` table + legal routes — consent flows присутствуют
- Audit logs / AI requests — warn-only при сбое записи (repudiation gap в threat model)

---

## Покрытие skills по subdomain (summary)

| Subdomain | Skills | Статус для FundingPro |
|-----------|--------|------------------------|
| api-security | 28 | EXECUTED / ADAPTED — OWASP API Top 10 на routes |
| web-application-security | 42 | ADAPTED — headers, CORS, XSS patterns |
| identity-access-management | 37 | EXECUTED — JWT, admin model, middleware |
| devsecops | 18 | EXECUTED — CI, gitleaks, npm audit, semgrep |
| ai-security | 14 | EXECUTED — prompt injection checklist |
| cloud-security | 66 | ADAPTED — Supabase/Vercel (не AWS/K8s) |
| mobile / OT / forensics / red-team / … | ~400+ | N/A — нет mobile app, OT, K8s и т.д. |

Полная матрица: [`skills-matrix.json`](security-audit/skills-matrix.json).

---

## Backlog remediation (приоритет)

1. **P0:** Добавить `SUPABASE_SERVICE_ROLE_KEY` в Vercel → redeploy production (headers + admin DB paths)
2. **P0:** Выровнять schema `plans` на remote Supabase или compatibility layer в `listPlans()`
3. **P1:** `npm audit fix` — закрыть 4 high CVE
4. **P1:** Supabase Auth — SMTP Resend + leaked password protection
5. **P2:** Pin GitHub Actions to SHA; enforce CORS; убрать in-memory AI rate limit в prod
6. **P2:** Audit 12 custom API routes; document public intent
7. **P3:** Optional manual wave — Burp/ZAP DAST для 24 TOOL_BLOCKED skills

---

## Заключение

FundingPro прошёл полный skills-driven аудит с документированным покрытием всех 817 skills. Критический риск открытого PostgREST (RLS) устранён. Основной остаточный риск — **отсутствие service role в production** (блокирует admin paths и часть public endpoints) и **schema drift** на таблице `plans`. После добавления ключа, redeploy и npm audit fix приложение будет соответствовать baseline hardening для beta/production.

**Threat model:** [`security-audit/threat-model.md`](security-audit/threat-model.md)  
**Machine-readable findings:** [`security-audit/findings.json`](security-audit/findings.json)
