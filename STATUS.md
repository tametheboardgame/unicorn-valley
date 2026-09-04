# Project Status

Last updated: 2026-09-04

## Current phase

R6.5 - Valley Completeness and Breadth

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP12 are integrated on `main`, including Starlight Beach, save/Continue restoration, geometry/graphics tightening, Crystal Brook and Whispering Woods depth, Existing Valley Quest Pack A, five regular race courses and the Rainbow Cup.

Latest accepted `main` gameplay baseline: `610216ae13b96772d3a7b7e95696c695ddcd1870` (R6.5-WP12 merge via PR #141).

WP12's final exact head `beff0cb4a62e3c5c20294c6f3224d5e48e755eb3` passed the operating contract, formatting, lint, type-check, unit tests, production build, the unchanged 520 KiB application-entry budget, static smoke, Chromium/Firefox/WebKit compatibility and the full Chromium playtest before merge.

## Active work package

ID: `R6.5-WP13`

Path: `docs/work-packages/R6.5-WP13-CROSS-REGION-FOLLOW-UP-STORIES.md`

Branch: `r6.5-wp13-cross-region-followups`.

Goal: connect the broadened valley through cross-region/follow-up stories and close any remaining gap to the R6.5 minimum of at least six new substantive story threads.

## WP13 starting state

No WP13 gameplay code has been implemented yet. This is an intentional clean handoff boundary.

The first action is to audit the actual R6.5 story-thread matrix across WP5-WP12 and the content registries. Count substantive threads separately from lightweight microstories. Do not assume how many new WP13 threads are required until that audit is complete.

WP11 contributes three known substantive threads:

- Willow and the Moonflowers After Dark;
- Nova, Clover and a Race With No Finish Line;
- Pebble and the Stone That Does Not Match.

WP11's Juniper's Butterfly Count and Maple's Perfect Picnic Spot are explicitly microstories and do not count toward the release-wide six-substantive-thread minimum.

After the audit, WP13 must still satisfy its qualitative coverage: a Starlight Beach follow-up, core-character friendship follow-up, supporting-resident chain, deliberate revisit to an older region after newer content unlocks, and at least one further persistent visual/dialogue state change.

## Technical validation

State: `pending` for WP13.

The standard gate remains formatting, lint, type-check, unit tests, production build, unchanged 520 KiB app-entry performance budget, static smoke, full Chromium playtest and Chromium/Firefox/WebKit compatibility.

## Human acceptance

State: `not_required` for WP13.

The next human release gate remains R6.5-WP17. R7 stays blocked until that gate is explicitly released.

## Recently completed

- R6.5-WP7 Crystal Brook depth reconciled and merged as `3e1224a33add119878635ad06e15c8ceb7f41c46`.
- R6.5-WP8 Whispering Woods depth reconciled and merged as `96c5e658f7069fcb5cef6dd8031fbbd13d94d5d4`.
- R6.5-WP11 Existing Valley Quest Pack A merged as `af532922d6a071adf86b345e5c94a81143f9832d` after its Odd Stone interaction regression was fixed and fully revalidated.
- R6.5-WP12 Race Expansion and Rainbow Cup merged as `610216ae13b96772d3a7b7e95696c695ddcd1870` after its lazy-Beach browser acceptance was corrected to traverse the real Woods gateway and the exact head went fully green.

## Next eligible work

1. Complete the WP13 substantive-story audit.
2. Implement the smallest coherent story set that satisfies the numerical and qualitative WP13 contract.
3. Fully validate and merge WP13.
4. Advance to R6.5-WP14 - Repeatable Activity Expansion.
5. Then WP15 Wonderbook/collections, WP16 final tidy/balance/content polish, and WP17 human playthrough/readiness gate.

## Blockers

No known technical blocker.

R7 remains hard-blocked by the R6.5-WP17 human readiness gate.

## Human decisions required

No immediate input required.

## Production / deployment

No production deployment was performed during the WP7-WP12 reconciliation and completion sequence. Production deployment still requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Fresh-chat resume instruction

A new project chat can resume safely by reading, in order:

1. `PROJECT_STATE.json`;
2. this `STATUS.md`;
3. `docs/work-packages/R6.5-WP13-CROSS-REGION-FOLLOW-UP-STORIES.md`;
4. the WP13 section of `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`;
5. `docs/work-packages/R6.5-WP11-EXISTING-VALLEY-QUEST-PACK.md` for the substantive-vs-microstory distinction.

The new chat should work from GitHub state rather than relying on prior chat history.

## Night Shift

State: `not_configured`

## Chat disposition

`handoff_ready`

Essential project continuity is externalised into GitHub state/docs rather than relying on chat history.

## Source-of-truth note

Current repository/code state, this file, `PROJECT_STATE.json` and the active bounded work package take precedence over stale historical plans, old PR descriptions and remembered conversation context. Detailed R6.5 scope remains canonical in `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md` and companion specifications.
