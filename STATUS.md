# Project Status

Last updated: 2026-09-05

## Current phase

R6.5 - Valley Completeness and Breadth

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP14 are integrated on `main`.

Latest accepted `main` gameplay baseline: `5d246ae012ef351e9dd356befc3a9608222041e6` (R6.5-WP14 merge via PR #143).

WP14 exact head `c6f9dd3f52166ba9c06330301059fec2ed3a9a6a` passed the project contract, formatting, lint, type-check, unit tests, production build, unchanged 520 KiB application-entry budget, static smoke, Chromium/Firefox/WebKit compatibility and the full Chromium playtest before merge. Browser playtest result: 141 passed, 3 intentionally skipped, 0 failed.

## Active work package

ID: `R6.5-WP15`

Path: `docs/work-packages/R6.5-WP15-WONDERBOOK-COLLECTIONS-LONG-TERM-GOALS.md`

Branch: `r6.5-wp15-wonderbook-collections-long-term-goals`.

Goal: expand the Wonderbook into a child-readable record of discoveries, friends, regions/collections, races/ribbons and gentle long-term goals derived from existing save state.

## WP15 implementation state

The bounded package is active and the foundation audit is complete:

- the existing Wonderbook currently presents discovery stickers plus All/Secrets only;
- `WonderbookCharacterModel` already exposes character/friendship state but is not yet surfaced by the scene;
- save schema v2 already contains discoveries, memories, relationship progress, world changes, race records/ribbons and mini-game records;
- WP12 race/Cup progress and WP14 Bakery/Beachcombing collection progress can therefore be represented without new persistence;
- WP15 will aggregate existing authorities rather than introduce a second completion ledger or save migration;
- the planned sections are discoveries/secrets, friends, places/region collections, races/ribbons and gentle long-term goals;
- the planned long-term tracks include Valley Explorer, Friendship Garden, Ribbon Journey and Curiosity Cabinet, with no streaks, timers, FOMO or punitive incompletion state.

## Technical validation

State: `pending` for WP15.

Implementation and focused tests are in progress. The full technical gate will run after the Wonderbook model/UI and browser acceptance are complete.

## Human acceptance

State: `not_required` for WP15.

The next human release gate remains R6.5-WP17. R7 stays blocked until that gate is explicitly released.

## Recently completed

- R6.5-WP12 Race Expansion and Rainbow Cup merged as `610216ae13b96772d3a7b7e95696c695ddcd1870`.
- R6.5-WP13 Cross-Region and Follow-up Stories merged as `3db374dd48445386819d1da97d4367619f7b9cef` after full exact-head validation.
- R6.5-WP14 Repeatable Activity Expansion merged as `5d246ae012ef351e9dd356befc3a9608222041e6` after full exact-head validation.

## Housekeeping

- Obsolete stacked PRs #127, #128 and #135 remain closed and superseded by merged reconciliation PRs #138, #139 and #140.
- PR #142 and PR #143 are merged and their final state records the validated WP13/WP14 work.
- WP14's bounded package is now marked complete on the WP15 hand-off branch.

## Next eligible work

1. Complete the pure WP15 Wonderbook aggregation model and focused unit tests.
2. Expand `WonderbookScene` to surface friends, regions/collections, races and long-term goals while preserving existing discovery/secret behaviour.
3. Add focused browser acceptance and run the full technical gate.
4. Merge WP15 once its exact head is fully green.
5. Advance to R6.5-WP16 tidy/balance/content polish, then WP17 human playthrough/readiness gate.

## Blockers

No known technical blocker.

R7 remains hard-blocked by the R6.5-WP17 human readiness gate.

## Human decisions required

No immediate input required.

## Production / deployment

No production deployment was performed. Production deployment still requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Fresh-chat resume instruction

A new project chat can resume safely by reading, in order:

1. `PROJECT_STATE.json`;
2. this `STATUS.md`;
3. `docs/work-packages/R6.5-WP15-WONDERBOOK-COLLECTIONS-LONG-TERM-GOALS.md`;
4. the WP15 section of `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`;
5. `src/game/wonderbook/` and `src/game/scenes/WonderbookScene.ts`.

The new chat should work from GitHub state rather than relying on prior chat history.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`

Essential project continuity is externalised into GitHub state/docs rather than relying on chat history.

## Source-of-truth note

Current repository/code state, this file, `PROJECT_STATE.json` and the active bounded work package take precedence over stale historical plans, old PR descriptions and remembered conversation context. Detailed R6.5 scope remains canonical in `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md` and companion specifications.
