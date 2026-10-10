---
id: ENG-WP1
title: CI and Development Process Hardening
status: in_progress
autonomy: green
depends_on: []
parallel_safe: false
human_gate: false
mini_game_platform_impact: none
---

# ENG-WP1 - CI and Development Process Hardening

## Purpose

Restore a trustworthy, fast development and merge pipeline before further feature work resumes.

Normal feature development is paused while this package is active. Do not begin Crystal Brook H6.6, advance MG-WP7 Pond Leap, or start another substantive feature package until ENG-WP1 has established a green and meaningful mainline qualification baseline.

## Baseline

Package start point: `main` at `31b9ac22067458990f5833f69137123dc282f7c8` on 10 October 2026.

Current accepted product state:

- Story House is complete through SH1.8, including Alice, Peter Rabbit, Jemima Puddle-Duck and The Lantern at the Edge of the Woods.
- Crystal Brook H6.0-H6.5 is complete and human-approved. H6.6 Crystal Cup Race Hub maturity is the next world-area checkpoint.
- MG-WP0-MG-WP6 are complete. MG-WP7 Pond Leap remains an existing paused draft stream.
- The current main CI has green verification planning, Tier 0, unit, build/static/performance and Tier 4 compatibility, but all three Tier 3 Chromium shards fail.
- The Tier 3 result contains 47 browser failures. These must be treated as a test-suite triage problem, not as 47 assumed production defects.

## Problem statement

The current development loop can consume many repeated CI cycles because:

- stale historical browser contracts remain in full qualification;
- deterministic formatter/static failures may be discovered serially;
- superseded PR runs can continue after a new head exists;
- browser tests can depend on obsolete object identities, coordinates or wall-clock timing;
- an earlier green PR head can become stale relative to a newer `main`;
- a red `main` baseline does not currently provide one unambiguous merge-stop signal;
- the repository rules describe parts of the intended fast-development/final-qualification model, but the workflow does not yet enforce the complete contract.

The goal is not to weaken qualification. The goal is to make red results actionable, green results trustworthy, and ordinary development feedback proportionate to the change.

## Non-goals

- no H6.6 implementation;
- no new mini-game feature work;
- no Story House content expansion;
- no gameplay redesign merely to satisfy obsolete tests;
- no lowering of product-visible quality or compatibility requirements;
- no production deployment.

## Checkpoints

### ENG-WP1.1 - State reset and maintenance package

- create this bounded package and branch;
- make `STATUS.md` and `PROJECT_STATE.json` reflect repository reality;
- record the temporary feature-development pause;
- establish the current CI failure baseline;
- open a draft PR for the package.

**Acceptance:** a fresh agent can see that ENG-WP1 is the only active package and can identify the paused feature streams and the next hardening action without relying on conversation history.

### ENG-WP1.2 - Reproduce the four current-contract candidates

Investigate separately:

1. Just Games -> Rainbow Run launch/return;
2. Just Games -> Firefly Lantern launch/return;
3. Story House Classic/Modern illustration-set switching;
4. Race -> Rainbow Run Hub return.

For each candidate, determine whether current product behaviour is broken or whether the browser harness is stale. Do not change production behaviour unless the current accepted contract genuinely fails.

### ENG-WP1.3 - Retire obsolete browser contracts

Remove or replace historical tests whose asserted implementation has deliberately been superseded. Preserve current behavioural coverage where it still matters.

### ENG-WP1.4 - Modernise stale browser contracts

Update useful tests to current coordinates, identifiers, fixtures, UX and architecture. Consolidate duplicated historical coverage where a smaller current contract is stronger.

### ENG-WP1.5 - Repair brittle test designs

At minimum:

- repair the H6.3 undefined `PLAYER_NAME` test defect;
- replace arbitrary H6.4 rock-clearance precision with a meaningful traversal contract;
- replace H6.4 wall-clock movement-distance inference with deterministic movement/simulation evidence.

### ENG-WP1.6 - Rebuild browser qualification layers

Separate:

- fast ownership-selected PR browser checks;
- a compact current whole-game smoke contract;
- broader feature regression qualification.

Historical work-package tests must not remain in the normal merge gate merely because they once existed.

### ENG-WP1.7 - Static/Tier 0 hardening

- aggregate cheap deterministic failures where practical so one run reports the useful set;
- retain formatter remediation evidence;
- make formatting a before-push requirement for changed source/content files.

### ENG-WP1.8 - CI execution hardening

- fail selected browser qualification if zero tests execute;
- validate required browser contexts/profiles;
- remove avoidable fixed waits and slow failure paths;
- add PR concurrency cancellation for superseded heads;
- review shard balance after suite cleanup.

### ENG-WP1.9 - Exact-head final qualification and merge gate

Implement the intended delivery model:

1. draft PR development uses focused verification;
2. human-approved feature work is updated onto latest green `main`;
3. Ready-for-Review triggers authoritative exact-head qualification;
4. subsequent pushes invalidate that qualification;
5. one final Merge Gate reports whether all required jobs for that plan passed.

Repository branch protection may require a separate GitHub configuration action after the in-repository mechanism is ready.

### ENG-WP1.10 - Development-rule reconciliation

Update `AGENTS.md`, `TESTING.md` and `ACCEPTANCE.md` so repository rules match the implemented CI machinery. Include failure aggregation, formatter-before-push, targeted development CI, exact-head qualification, stale-test handling, wall-clock timing guidance, Git reconnect behaviour and bounded CI status checks.

### ENG-WP1.11 - Full repaired baseline and closeout

Run the repaired qualification suite on the exact package head. Merge only when the result is meaningful and green, then verify `main` once and record the new trusted baseline.

After closeout:

- clean up confirmed obsolete PRs;
- refresh/rebase the paused MG-WP7 branch;
- resume Crystal Brook at H6.6 and MG at WP7 under the hardened process.

## Progress

### ENG-WP1.1

Complete. Dedicated hardening branch/package, truthful status/state pointers and draft PR #299 are established.

### ENG-WP1.2

Complete. Four current-contract candidates were reproduced on the current branch. Firefly Lantern return, Story House illustration-set switching and normal Race -> Rainbow Run Hub return were confirmed healthy. Just Games -> Rainbow Run exposed one genuine Escape-return defect in RaceScene; that was fixed with event-driven Escape handling plus a one-shot exit guard, then all four focused reproduction contracts passed on commit `4a74df03faf00a70d5a8fdc249448a1a9c5c803e`.

### ENG-WP1.3

Complete. The 14 failures classified as obsolete historical contracts were retired without removing current replacement coverage:

- removed the obsolete Rainbow Meadow cases from R3 visual-tightening and traversal-polish parameter sets;
- removed the two pre-H4 Nova exact-position / in-world race-choice tests;
- removed the legacy R5 Meadow optional-content branch cue;
- removed the pre-H6 Crystal Brook gateway-art assertion;
- removed two superseded R6.18G Meadow/gateway compatibility assertions;
- deleted the R6.18IJ direct Brook path / direct Crystal Cascade race-gate file;
- removed Rainbow Meadow from the legacy environment-production region loop;
- removed the unused future cottage portal placeholder test;
- deleted the superseded H4.2 exact Meadow layout contract;
- deleted the superseded H4.3 Meadow path-network contract.

Current replacement owners are H4.10/H4.11 for Meadow composition/traversal, H4.7 for Rainbow Run Hub extraction/reachability, the surviving gateway-art coverage for accepted Meadow/Woods presentation, and H6-era tests for current Crystal Brook topology. The replacement-owner qualification passed on commit `4c7ffde8e57d4e40e12a669f4bdc1578063ce0c7`. The H6.3 harness defect remains intentionally deferred to ENG-WP1.5 rather than being mixed into this retirement checkpoint.

### ENG-WP1.4

Active. Modernise the 26 useful but stale browser contracts in bounded families. Preserve the behavioural requirement while replacing outdated save fixtures, coordinates, object identities, fixed layout dimensions and pre-refinement mini-game assumptions.

First bounded family (complete and focused CI green on `10916c463ba225cba51dacd28280df32a664d116`):

- profile-redesign save fixture drift;
- title/home responsive layout contracts;
- cottage decorating presentation readiness.

Second bounded family (runtime repair committed; focused browser qualification pending):

- current Nova placement at Rainbow Run Race Hub and conditional Picnic Hill presence;
- Willow, Marigold and Nova dialogue activation from current locations;
- picnic transition and scene-session presence checks;
- confirmed WP19D interaction-registry migration regression: the shared Rainbow Meadow registry omitted both Marigold and Nova Talk targets at Picnic Hill; restored both using the canonical NPC presence authority;
- replaced the migrated-conversation test's diagnostic scene-switch navigation with normal Boot/Preload entry routes to avoid deactivating the Race Hub during its startup.

The earlier NPC production-identity subfamily passed targeted browser checks on `846ff7c59b3ec87e2347dfe6b538561277e4b2f3`. The combined dialogue/picnic run `38080724124` confirmed two real blockers (inactive hub after diagnostic transition, missing Marigold Talk). Both are addressed in this repair checkpoint but remain unqualified until CI returns.

## Operating rules during this package

- Work one checkpoint at a time.
- Use focused validation while repairing a test family.
- Do not repeatedly dispatch the full Chromium matrix after each small change.
- Inspect the complete failed job and available diagnostics before making a remediation commit.
- Aggregate deterministic fixes into one correction where safe.
- Do not weaken a test merely to make CI green; first identify the current product contract.
- If a test asserts behaviour deliberately replaced by a later approved package, retire or rewrite the test rather than restoring obsolete production behaviour.
- Do not poll CI continuously. A pending external run is a valid hand-off state.
- If GitHub access fails, immediately attempt reconnection before reporting a blocker.

## Next action

Qualify the corrected **ENG-WP1.4** dialogue/picnic browser family. Only after it passes, advance to contextual-feedback browser contracts.
