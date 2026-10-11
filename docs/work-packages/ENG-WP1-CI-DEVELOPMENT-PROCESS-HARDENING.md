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

Second bounded family (complete; focused browser qualification green):

- current Nova placement at Rainbow Run Race Hub and conditional Picnic Hill presence;
- Willow, Marigold and Nova dialogue activation from current locations;
- picnic transition and scene-session presence checks;
- confirmed WP19D interaction-registry migration regression: the shared Rainbow Meadow registry omitted both Marigold and Nova Talk targets at Picnic Hill; restored both using the canonical NPC presence authority;
- replaced the migrated-conversation test's diagnostic scene-switch navigation with normal Boot/Preload entry routes to avoid deactivating the Race Hub during its startup.

The NPC production-identity subfamily passed on `846ff7c59b3ec87e2347dfe6b538561277e4b2f3`. The dialogue and shared interaction regression tests passed (15/15) on `4da9cdd883ad6da7e1b0a4b5de9729fe84a50577`. The dedicated complete Marigold/Nova Picnic Hill conversation and return regression passed on `a3ead042252f567fc137d7aaaec810958223bb0c` (CI run `38123716309`). No further NPC/picnic remediation is pending.

Third bounded family (complete; focused qualification green):

- modernise Crystal Brook contextual feedback and responsive-evidence tests to the accepted H6 map topology;
- use the canonical Crystal Grotto and Shallow Brook landmark coordinates rather than stale test-only positions;
- enter via the normal Brook Boot/Preload path and remove arbitrary initial/reaction timing waits;
- preserve the guidance/reaction distinction, safe positioning, semantic prompt and portrait touch evidence requirements.

The historical Chromium baseline recorded seven contextual-feedback failures across these two files. All seven failed before the expected guidance or reaction was reachable at obsolete coordinates. The modernised core tests passed 2/2 on `f4c4f7744974660937a3f65ad9bf8c3887b8e27c` (run `38124156235`), and all six responsive/discovery tests passed on `b3ac1e68660e4305b6f8f0035e9c4b917613fd5a` (run `38124423134`).

Fourth bounded family (complete; focused qualification green):

- align mobile racing contracts with the touch RUN/JUMP/Leave deck and retired canvas Exit control;
- the first focused run `38124659945` passed landscape and hybrid touch cases, but the two portrait cases exposed a real defect: the mobile Leave button attempted to emit pointerdown on the retired canvas Exit object, doing nothing;
- route mobile Leave through the scene's canonical exit method (including checkpoint handling), and assert return to the current Rainbow Run Race Hub rather than the obsolete direct Rainbow Meadow destination;
- preserve tests for real movement, jumping, disabled duplicate controls, both portrait race types and landscape/hybrid layout.

All four mobile-race cases and 29 other selected regression tests passed on `a5726db43782b7293d02c0f88edb0d35769ce91e` (CI `38125054158`, 33/33). The repaired Leave action now routes through the race scene's canonical exit implementation.

Fifth bounded family (complete; focused qualification green):

- modernise Rainbow Meadow ⇄ Rainbow Run Race Hub gateway coordinates and race-exit readiness;
- use the existing browser diagnostic helper to await race controls before asserting Escape.
- all three Race Hub contracts passed on `ae7c897043d6099a479e2476490803992c7dace7` (CI `38125477510`, 3/3).

Sixth bounded family (active; focused qualification pending):

- refresh H4.9 Rainbow Disc match/practice test timing to await the visible, unlocked timing meter before priming throws;
- test possession turnover by selecting a currently defended receiver rather than assuming a fixed marked lane;
- preserve match scoring, practice results, defender read cues and Just Games behaviour without changing game mechanics.

The earlier full Chromium baseline had three failures in `tests/play/r6.5-wp19h4.9-rainbow-disc.spec.ts`; MG-WP6 replacement owner coverage in the baseline was already green. The focused suite has ranged from 3/6 to 5/6 passing while isolating unstable input sequences. The latest run `38127304194` passed four of six; match scoring and defended-lane tests failed when sprite clicks/drags did not deterministically commit the intended lane. The new checkpoint `6ba5398e0025d4641b523c87ceea6686bba060ba` selects lanes using actual keyboard Up/Down commands, followed by Space, and preserves deterministic timing, scoring and possession assertions. Targeted browser qualification `38127868904` is pending. Do not close this family until 6/6 passes.

Seventh bounded family (complete; focused qualification green):

- align H6.4 rock-perimeter validation to the accepted physical Woods opening rather than obsolete east woodland/sign object identities;
- validate minimum gorge clearance against the authored opening plus safety margin;
- hold player movement until the intended travelled distance is observed instead of assuming a fixed software-renderer frame rate.
- both H6.4 browser contracts passed on `3b90541a63fe2b46b7688039ef2140d934e23b1c` (CI `38126837711`, 2/2).

Eighth bounded family (complete; focused qualification green):

- modernise SH1.2A Story House independent illustration sets and persistence test for the current compact Modern/Classic switch;
- verify modern and classic image sources genuinely differ without coupling to obsolete file names;
- retain the distinct single-illustration-set behaviour of another book.
- all five Story House/Village Interior contracts passed on `85f38ec54e3c92163190b503d1a1c4bc11d4ac66` (CI `38127180622`, 5/5).

Ninth bounded family (complete; focused qualification green):

- modernise R6.5-WP18F visual evidence for the accepted placement of Nova at Rainbow Run Race Hub instead of the old permanent Meadow position;
- retain Meadow player-production-body evidence, and capture Nova beside the player at the current Hub using its authored layout coordinates.
- all five R6.5-WP18F world visual-evidence contracts passed on `183a8bfa54a78d98dc6a7ce12856cac862231796` (CI `38127429300`, 5/5).

Tenth bounded family (active; focused qualification pending):

- modernise the surviving R5 optional-content discovery contract in Crystal Brook to assert the H6 Crystal Grotto threshold instead of a retired Prism Grotto branch plaque;
- retain world-space visibility/active checks and the no-duplicate-object revisit invariant;
- correction `194fc7fde49a99d401787bbdf7c79fc76d5d398f` awaits focused browser qualification (CI `38128027531`).

ENG-WP1.5 early isolated harness checkpoint (complete and focused CI green):

- H6.3 Meadow/Brook gorge regression referenced a Node-only constant inside a browser-evaluated function, causing `ReferenceError: PLAYER_NAME is not defined`;
- pass the object name explicitly into `page.evaluate`, and enter via normal Meadow Boot/Preload instead of a diagnostic scene restart;
- bidirectional traversal with no arrival bounce-back passed on `8d7d0ac94819c24bc9cc8338d335661c85660d90` (CI `38126714606`, 1/1).


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

Qualify the remaining sixth **ENG-WP1.4** Rainbow Disc and tenth current-H6 optional-content families on targeted browser CI. Audit the surviving useful contracts against the initial full Chromium baseline. Then complete ENG-WP1.5 harness hardening, final workflow guardrails, and one meaningful full baseline before merging. Do not poll CI or run the full Chromium matrix repeatedly.
