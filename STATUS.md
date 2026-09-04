# Project Status

Last updated: 2026-09-04

## Current phase

R6.5 - Valley Completeness and Breadth

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP13 are integrated on `main`.

Latest accepted `main` gameplay baseline: `3db374dd48445386819d1da97d4367619f7b9cef` (R6.5-WP13 merge via PR #142).

WP13 exact head `e7c9ec9344de84bc91968e8deaaafb47d28f3c1a` passed the project contract, formatting, lint, type-check, unit tests, production build, unchanged 520 KiB application-entry budget, static smoke, Chromium/Firefox/WebKit compatibility and the full Chromium playtest before merge. Browser playtest result: 139 passed, 3 intentionally skipped, 0 failed.

## Active work package

ID: `R6.5-WP14`

Path: `docs/work-packages/R6.5-WP14-REPEATABLE-ACTIVITY-EXPANSION.md`

Branch: `r6.5-wp14-repeatable-activity-expansion`.

Goal: add two real, optional, repeatable non-racing activities so Firefly Lantern + Bakery + Beachcombing provide at least three credible activity choices before R7 preference review.

## WP14 implementation state

The initial implementation is substantive and active:

- a bounded WP14 activity contract is committed;
- Maple's completed Wobbly Cake story now unlocks a separate repeatable Bakery activity entry;
- the Bakery activity is a three-step, touch-first cake design flow with theme, topping and finish choices, no timer and no fail state;
- Coral's Starlight Beach content now gains a separate beachcombing notebook interaction beside the original introductory basket;
- the Beach activity asks the player to inspect four large observation targets, records nature-friendly notebook pages and has no timer/fail state;
- both activities save finite 0-3 collection progress through existing `activities.miniGameRecords`;
- six new Wonderbook discoveries cover three Bakery styles and three Beach notebook pages;
- each activity earns the standard first-activity Shimmer reward once through the existing economy authority; replays do not farm currency;
- no save-schema change is introduced;
- activity presentation and scene code remain dynamically loaded/on-demand to protect the hard application-entry budget;
- focused unit coverage and browser acceptance have been added.

## Technical validation

State: `pending` for WP14.

The next action is to open the WP14 PR and run the full technical gate: project contract, formatting, lint, type-check, unit tests, production build, unchanged 520 KiB app-entry budget, static smoke, full Chromium playtest and Chromium/Firefox/WebKit compatibility.

## Human acceptance

State: `not_required` for WP14.

The next human release gate remains R6.5-WP17. R7 stays blocked until that gate is explicitly released.

## Recently completed

- R6.5-WP11 Existing Valley Quest Pack A merged as `af532922d6a071adf86b345e5c94a81143f9832d`.
- R6.5-WP12 Race Expansion and Rainbow Cup merged as `610216ae13b96772d3a7b7e95696c695ddcd1870`.
- R6.5-WP13 Cross-Region and Follow-up Stories merged as `3db374dd48445386819d1da97d4367619f7b9cef` after full exact-head validation.

## Housekeeping

- Obsolete stacked PRs #127, #128 and #135 remain closed and superseded by merged reconciliation PRs #138, #139 and #140.
- PR #142 is merged and its final body records WP13 validation/merge evidence.
- WP12 companion implementation notes are correctly marked complete.

## Next eligible work

1. Fully validate the current WP14 implementation and fix any genuine regression.
2. Merge WP14 once its exact head is fully green.
3. Advance to R6.5-WP15 - Wonderbook, Collections and Long-Term Goals.
4. Then WP16 final tidy/balance/content polish and WP17 human playthrough/readiness gate.

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
3. `docs/work-packages/R6.5-WP14-REPEATABLE-ACTIVITY-EXPANSION.md`;
4. the WP14 section of `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`;
5. `src/game/activities/` for the activity implementation/progress authority.

The new chat should work from GitHub state rather than relying on prior chat history.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`

Essential project continuity is externalised into GitHub state/docs rather than relying on chat history.

## Source-of-truth note

Current repository/code state, this file, `PROJECT_STATE.json` and the active bounded work package take precedence over stale historical plans, old PR descriptions and remembered conversation context. Detailed R6.5 scope remains canonical in `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md` and companion specifications.
