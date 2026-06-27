# ADR: Certificate Pinning for Mobile API (M-03)

**Status:** Accepted — no pinning for v1.0  
**Date:** 2026-06-27  
**Finding:** M-03 (Medium) — No certificate pinning for mobile API  
**Related:** [`SECURITY.md`](./SECURITY.md), [`fundingpro/docs/SECURITY-ROADMAP.md`](../../fundingpro/docs/SECURITY-ROADMAP.md)

## Context

FundingPro mobile calls the web API (`/api/v1/*`) and Clerk over HTTPS. A network attacker with a compromised CA or on-path MITM could intercept TLS if the device trusts a rogue certificate.

Certificate (or public-key) pinning binds the client to expected server certificate hashes, reducing MITM risk when a user-installed or compromised CA is present.

## Decision

**We will not implement TLS certificate pinning in v1.0.** Mobile continues to rely on the platform TLS stack (NSURLSession / OkHttp) with standard system trust stores.

## Rationale

| Factor | Without pinning (chosen) | With pinning |
|--------|------------------------|--------------|
| Cert rotation (Vercel, CDN, Clerk) | Automatic — no app release | Requires app update or dual pins + rollout |
| Clerk / third-party auth | Works out of the box | Must pin multiple hosts or exclude Clerk |
| Expo managed workflow | No native module maintenance | Needs custom dev client + `react-native-ssl-pinning` or similar |
| Threat model for v1 | Primary controls: Clerk JWT, server-side auth, no secrets in client | Pinning adds defense-in-depth for targeted MITM |
| Operational cost | Low | High — runbook for every cert change |

For MVP/pilot, authenticated API access is already gated by short-lived Convex JWTs from Clerk; grant catalog data is largely public. Pinning would add release and ops friction disproportionate to current risk.

## Consequences

- **Accepted risk:** M-03 remains open for v1.0 with documented rationale.
- **Mitigations in place:** HTTPS-only API base URL, no custom trust-all handlers, server-side authorization, SecureStore for tokens, validated deep links.
- **Revisit triggers:** Store security questionnaire requiring pinning; dedicated pen-test finding; move to self-hosted API edge with fixed cert lifecycle.

## Future implementation (if required)

1. Pin **API host only** (`www.fundingpro.uz`), not Clerk — Clerk rotates certs independently.
2. Use **SPKI hash pinning** with backup pin before primary expiry.
3. Ship via Expo config plugin + EAS; document rotation in release checklist.
4. Add integration test that rejects wrong pin in staging builds only.

## Alternatives considered

1. **Full pinning (API + Clerk)** — Rejected: Clerk rotation would break auth frequently.
2. **Trust-on-first-use** — Rejected: weak against first-launch MITM; poor UX on reinstall.
3. **VPN / mTLS for enterprise** — Out of scope for consumer MVP.
