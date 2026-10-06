---
id: MG-WP7
title: Pond Leap expansion
status: in_progress
autonomy: amber
depends_on: [MG-WP6]
parallel_safe: true
human_gate: playtest
mini_game_platform_impact: changed - pond-leap
---

# MG-WP7 — Pond Leap expansion

## Current checkpoint

**MG-WP7A-D are complete. MG-WP7E — mode, replay and integration polish is implemented and automated qualification is pending.**

Detailed design contract: `docs/minigames/POND-LEAP-EXPANSION-DESIGN.md`.

## Objective

Deepen the existing Lily Pad Leap timing activity into a replayable child-friendly game with multiple course patterns, clearer difficulty choices and distinct relaxed/challenge play while preserving its immediate one-button readability, Rainbow Meadow placement and shared mini-game architecture.

## Baseline

Existing implementation:

- canonical game ID `pond-leap`;
- canonical scene `PondLeapActivityScene`;
- one catalogue entry with no visible variants;
- Rainbow Meadow pond placement;
- Just Games exposure through the same scene;
- one fixed six-pad presentation producing five successful hops;
- Space / Enter and touch LEAP input;
- one moving timing marker and one green success zone;
- hop-specific centre, tolerance and sweep speed;
- a miss splashes, holds the player on the same pad and retries;
- completion reports perfect/non-perfect crossing and supports replay;
- no adventure progression or economy side effects.

Accepted Rainbow Meadow presentation remains baseline and must not regress:

- the pond, frogs and lily-pad world identity remain in Rainbow Meadow;
- the activity keeps a bright rounded presentation with no whole-screen shadow overlay;
- the game remains understandable from a single visible timing meter and one primary action.

## Audit findings

### 1. Replay depth is very limited

Every run uses the same five hops, pad positions, timing centres and tolerance curve. Once the pattern is learned there is little reason to replay beyond chasing a perfect crossing.

### 2. Difficulty is hidden

The game gets gradually faster/tighter, but the player cannot choose a relaxed or challenging experience and the change is not explained.

### 3. Course data is presentation-bound

Pad geometry, timing centres and tolerances are hard-coded separately inside the scene. WP7 should move the underlying course/timing rules into deterministic data/helpers so additional courses do not duplicate scene logic.

### 4. Miss recovery is safe but flat

A miss has clear splash feedback and retries the same pad, which is suitable for the default mode. A challenge mode can create more tension, but the forgiving classic behaviour must remain available.

### 5. Input parity is already structurally simple

Touch LEAP and Space/Enter call the same `tryLeap` path. WP7 should preserve this strength and add any new controls through the same rules path.

### 6. World/Just Games identity should remain one game

WP7 must not create separate world and Just Games implementations. Rainbow Meadow remains the physical home; Just Games may expose richer mode selection while launching the same scene.

## Bounded implementation sequence

### MG-WP7A — Audit and expansion design

Deliverables:

- audit existing timing, course, miss/recovery and replay behaviour;
- confirm world/Just Games single-scene contract;
- freeze mode and course architecture;
- record input/presentation constraints.

Acceptance:

- one documented gameplay model;
- no duplicated scene plan;
- classic one-button readability remains protected;
- later slices have explicit ownership.

**Status: complete.**

### MG-WP7B — Rules, assistance and course foundation

Deliverables:

- extract deterministic Pond Leap rules/course definitions from scene presentation;
- define player-facing Relaxed / Standard / Quick timing profiles;
- define at least three course/pattern sets;
- keep touch and keyboard on one leap-resolution path;
- add unit coverage for timing windows, course sequencing and challenge rules.

Acceptance:

- the scene no longer owns unexplained arrays of timing values;
- the same course definition drives pad/timing progression;
- assistance changes visible timing speed/window rather than silently converting failures to successes.

**Status: complete.**

### MG-WP7C — Classic Crossing and course presentation

Deliverables:

- preserve the current forgiving crossing as the default world-compatible mode;
- allow multiple visually distinct course/pattern sets without creating extra scenes;
- improve next-pad readability and hop progression;
- retain same-pad retry after a splash;
- surface chosen help level clearly.

Acceptance:

- a first-time player can still understand the game from the meter + LEAP action;
- different courses produce genuinely different timing/route patterns;
- world entry remains immediately playable.

**Status: complete.**

### MG-WP7D — Practice Pond and Ripple Rush

Deliverables:

- **Practice Pond**: relaxed bounded practice focused on timing/streak improvement with no fail state;
- **Ripple Rush**: challenge-oriented bounded run with progressively faster/tighter timing and an explicit splash allowance;
- session-local best streak/result presentation;
- concise mode rules visible before starting.

Acceptance:

- Practice and Ripple Rush feel mechanically distinct from Classic Crossing;
- a miss has an understandable consequence in each mode;
- no mode writes adventure progression.

**Status: complete.**

### MG-WP7E — Mode, replay and integration polish

Deliverables:

- coherent in-scene mode/course/help navigation;
- world pond defaults to Classic Crossing;
- Just Games exposes useful mode choices without duplicating gameplay;
- Play Again / Change Course / Modes / Back flows;
- session-driven Back to Meadow / Back to Games;
- child-readable result and failure presentation.

Acceptance:

- one canonical `PondLeapActivityScene` serves all entries;
- mode switching never requires returning to the Just Games catalogue;
- return behaviour remains launch-context aware.

**Status: implementation complete / automated qualification pending.**

### MG-WP7F — Responsive/accessibility qualification and human playtest

Deliverables:

- touch target and one-button timing feel pass;
- keyboard parity pass;
- representative phone/tablet containment;
- timing-zone readability pass;
- reduced-friction miss/retry review;
- automated qualification;
- human playtest.

Human gate:

- a child understands when to leap without reading dense instructions;
- Relaxed feels genuinely easier without playing automatically;
- Standard feels fair;
- Quick/Ripple Rush feels challenging rather than arbitrary;
- different courses are noticeable;
- misses recover quickly;
- replay/navigation encourages another go.

Do not merge final WP7 until the human gate is explicitly approved.

## Non-goals

- no new adventure quest/economy/reward progression;
- no persistent record system unless separately justified;
- no second Pond Leap gameplay scene;
- no complicated multi-button movement mechanic;
- no life/energy system;
- no removal of the forgiving classic crossing.

## Verification policy

Run Pond Leap-owned deterministic unit/browser coverage plus the shared mini-game launch/return contracts.

Existing unrelated suite failures must be identified as baseline rather than silently weakened inside WP7.
