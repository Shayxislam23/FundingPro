# North Star instrumentation

**Metric:** % of «Мой путь» (`labParticipants`) with application proof `submitted` or `completed`.

**Targets** ([STARTUP_SURVIVAL_PLAN.md](./STARTUP_SURVIVAL_PLAN.md)): Week 2 ≥20% · Month 1 ≥35% · Month 3 ≥50%.

## Where it lives

| Surface | What |
|---------|------|
| Admin UI | `/admin/funnel` — `northStarRate`, `labParticipants`, `withVerifiedApplication` |
| Convex | `adminStats.funnel` |
| Client events | `north_star_application_submitted` ([lib/analytics.ts](../lib/analytics.ts)) |
| Server events | `POST /api/v1/onboarding/tasks` when `taskType=application_submitted` |

## Ops

1. Open PostHog/Plausible (if keys set) → filter `north_star_*`.
2. Weekly: screenshot `/admin/funnel` with «За 30 дней».
3. Empty labParticipants → rate is 0 — fix acquisition first, not the metric.
