# Work Packages

A work package is the bounded unit of autonomous execution.

Use one Markdown file here for each active or newly created substantial package. Historical release specifications elsewhere under `docs/` remain valid; this directory provides the concise execution hand-off for current/future work.

## Required front matter

```yaml
---
id: R6.5-WP5
title: Package title
status: approved
autonomy: green
depends_on: [R6.5-WP2, R6.5-WP3]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
---
```

Statuses: `proposed`, `approved`, `in_progress`, `waiting_human`, `blocked`, `complete`, `cancelled`.

Autonomy: `green`, `amber`, `red`.

Common human gates: `none`, `review`, `visual`, `playtest`, `product`, `release`.

Every current or next work package must declare `mini_game_platform_impact` before it can become active. Allowed values are:

- `none`;
- `changed - <id>`;
- `new - <id> - world-first`;
- `new - <id> - just-games-first`.

Use `changed - platform` for changes to the shared mini-game platform itself. Historical packages are not retrofitted, but the project-state validator rejects a current/next package that omits or malforms this declaration.

## Standard body

Each package should cover:

- Objective
- Context / Why
- Dependencies
- Scope
- Non-goals
- Invariants / Frozen Baseline
- Implementation Guidance
- Acceptance Criteria
- Technical Validation
- Human Acceptance
- Risk / Backout where material
- Delivery where it differs from defaults
- Completion Record

The detailed canonical release document may contain more context. The bounded package must still be sufficient for a fresh agent to know what it is authorised to do, how to validate it and where it must stop.

## Current proposed programme

Start with `R6.5-WP19-PLAN-WHOLE-GAME-AUDIT.md` and `docs/2026-09-08-REMEDIATION-PROPOSAL.md`. WP19A-I bounded files are proposed and await approval. WP18K remains the behaviour-preserving foundation between WP19A and WP19B. No gameplay implementation was done by the audit.
