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
---
```

Statuses: `proposed`, `approved`, `in_progress`, `waiting_human`, `blocked`, `complete`, `cancelled`.

Autonomy: `green`, `amber`, `red`.

Common human gates: `none`, `review`, `visual`, `playtest`, `product`, `release`.

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
