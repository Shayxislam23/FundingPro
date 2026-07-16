---
name: llm-council
description: Runs Karpathy-style LLM Council deliberation (parallel perspectives, anonymized peer rank, chairman synthesis) to prioritize decisions. Use when the user asks for council method, Karpathy council, multi-model deliberation, or ranked next steps across conflicting priorities.
disable-model-invocation: true
---

# LLM Council (Karpathy method)

Three-stage deliberation patterned after [karpathy/llm-council](https://github.com/karpathy/llm-council).

## When to use

- Competing priorities (product vs eng vs ops)
- Go-live / triage decisions
- “What next?” with incomplete secrets or device access

## Stage 1 — Independent perspectives

Answer the same query from **distinct roles** without referencing each other:

1. Product / Go-live
2. Mobile / client
3. API / backend
4. DX / tooling (optional)

Each role outputs: verdict (3–6 bullets), top risks, top 1–3 actions.

## Stage 2 — Anonymized peer rank

Label Stage 1 outputs **Response A/B/C/D** (hide role names). For each response, rank all others by:

`score = impact_on_users × feasibility_now`

Feasibility discounts anything needing human secrets, billing unlock, or physical devices when the agent cannot obtain them.

Produce aggregate ranking (average position).

## Stage 3 — Chairman synthesis

Synthesize one backlog:

1. **Do now** (agent-executable)
2. **Stage-0 human** (secrets / device / billing)
3. **Do not do now** (scope traps)

Keep dissent visible: one short “strongest disagreement” note.

## Output template

```markdown
# Council: [query]

## Stage 1
### Response A …
### Response B …

## Stage 2 rankings
1. …
2. …

## Stage 3 — Chairman
### Do now
### Human Stage-0
### Out of scope
### Strongest dissent
```

## Rules

- Prefer concrete file/API actions over vague strategy
- Prefer closing contract mismatches over new features
- Never pretend ops secrets were completed in-agent
