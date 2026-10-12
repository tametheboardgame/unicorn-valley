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

## Two-stage Test Impact Assessment (ENG-WP2)

New/current work packages have a short provisional impact note at planning and an exhaustive review at **finalisation**, not during each small draft visual adjustment.

```md
## Test Impact Assessment
- Stage: provisional / reviewed
- Affected behaviours, owner groups and known risks:
- Potential regression coverage: TBC during draft
- Final actual-diff test/ownership reconciliation: completed before Ready for review
- Tests added/updated/replaced OR unchanged with reason:
- Final reviewer, evidence and exceptions:
```

Maintain rapid preview iteration on draft PRs. Once the user has approved the result where required, tidy code and documentation, then complete the test-impact review and run full exact-head CI before merge. The planned WP2.2 validator must permit provisional drafts and block incomplete final reviews. Do not retrofit closed packages. See `AGENTS.md`, `TESTING.md` and the current ENG-WP2 package.

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
