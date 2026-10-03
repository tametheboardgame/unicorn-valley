# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP1 - Existing Game Migration to One Launch Contract**

Branch: `agent/mg-wp1-existing-game-migration`

PR: **#263**

MG-WP0 is complete, human-approved and merged to `main` as `dc24989ebec4261301dd521da2d8e9a9ac91f17e`.

### Current checkpoint - MG-WP1F

Implementation is complete across all migration checkpoints:

- MG-WP1A - Rainbow Disc, Pond Leap and Sunbeam Chess;
- MG-WP1B - Wobbly Cake;
- MG-WP1C - Coral Beachcombing;
- MG-WP1D - Firefly Lantern;
- MG-WP1E - Rainbow Run Racing, including all five regular courses and Rainbow Cup launch paths;
- MG-WP1F - stale registration/launch audit and closeout.

The branch-level audit is recorded at:

`docs/audits/2026-10-03-MG-WP1-MIGRATION-CLOSEOUT-AUDIT.md`

Automated PR review identified one remaining race-recovery lifecycle bypass and this has been corrected by routing the recovery overlay's Retry/Exit controls back through `RaceScene`'s session-aware actions.

No gameplay rules, world coordinates, quest progression or world reward behaviour have intentionally changed.

## Validation state

Cumulative MG-WP1 validation has established:

- Tier 0 static/architecture and project-contract validation passed;
- Tier 1 unit contracts passed;
- targeted browser validation is part of the cumulative qualification;
- production build and static smoke pass;
- the performance gate remains red because the first-playable graph is slightly above the existing 560 KiB budget and the branch currently reports two chunks above the 112-chunk budget.

The performance result must be compared against the exact current `main` baseline before MG-WP1 is approved. Any MG-WP1-attributable chunk regression must be removed rather than waived as baseline.

## Human gate

MG-WP1 remains Amber until:

- the race recovery review fix is validated on the exact head;
- the performance comparison confirms no unresolved MG-WP1 regression;
- a successful Cloudflare preview exists for that exact head;
- David completes the human gate and approves the package.

## Next work

After MG-WP1 approval and merge, begin:

**MG-WP2 - Sandbox, Rewards and Persistence Isolation**

Package:

`docs/work-packages/MG-WP2-SANDBOX-PERSISTENCE-ISOLATION.md`

## Operating reminders

- Do not start MG-WP2 on top of an unmerged MG-WP1 branch.
- On deterministic current-work CI failure, inspect and remediate it immediately.
- If Git/GitHub access fails, reconnect before reporting a blocker.
- Do not duplicate mini-game implementations or scene registries.
