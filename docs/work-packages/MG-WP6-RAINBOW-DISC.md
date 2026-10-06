---
id: MG-WP6
title: Rainbow Disc expansion
status: complete
autonomy: amber
depends_on: [MG-WP5]
parallel_safe: true
human_gate: playtest
mini_game_platform_impact: changed - rainbow-disc
---

# MG-WP6 — Rainbow Disc expansion

## Current checkpoint

**MG-WP6A-F are complete. The final responsive/accessibility and human-playtest gate was explicitly approved on 2026-10-06.**

Detailed design contract: `docs/minigames/RAINBOW-DISC-EXPANSION-DESIGN.md`.

## Objective

Turn the existing Rainbow Disc activity into a replayable sport game with a real short-match loop, coherent input skill model, meaningful practice drills and child-appropriate assistance while preserving the accepted Rainbow Meadow placement and shared mini-game architecture.

## Baseline

Existing implementation:

- canonical game ID `rainbow-disc`;
- canonical scene `RainbowDiscActivityScene`;
- catalogue variants `match` and `practice`;
- Rainbow Meadow pitch launches `match`;
- Rainbow Meadow practice range launches `practice`;
- Just Games exposes both variants;
- touch/pointer drag throw;
- keyboard lane/target selection and Space/Enter throw;
- attack and defence phases;
- three-lane passing;
- timing meter;
- five-throw target practice;
- no durable adventure side effects.

Accepted H4.9 visual fixes remain baseline and must not regress:

- teammates and defenders use consistent scale;
- unicorns remain centred to their lane/ring presentation;
- horn/catch placement is coherent;
- practice targets remain horizontally arranged above the field/practice space;
- no whole-screen shadow overlay;
- rounded activity/result presentation.

## Audit findings

### 1. Match depth

Current Match completes after one three-catch chain. Opposition scoring during defence does not contribute to a persistent match score. WP6 must create a real bounded match result.

### 2. Defence readability

Current defence chooses a hidden attack lane. WP6 must provide a readable telegraph so defence is a reaction/reading skill rather than blind guessing.

### 3. Input parity

Current pointer throws are primarily resolved from release position while keyboard throws use the timing meter. WP6 must converge both onto one throw-quality model.

### 4. Practice depth

Current Practice is one five-throw target range. WP6 should retain that foundation and add at least a passing drill plus one progressive accuracy/streak challenge.

### 5. Assistance

Current target-specific timing tolerances do not form a coherent player-facing assistance system. WP6 introduces Gentle / Standard / Challenge profiles based on transparent timing/cue tolerance.

## Bounded implementation sequence

### MG-WP6A — Audit and expansion design

Deliverables:

- audit current Match/Practice mechanics;
- confirm world/Just Games launch contracts;
- identify current input inconsistency;
- freeze sport-loop, assistance and mode architecture;
- record existing visual regression constraints.

Acceptance:

- one documented gameplay model;
- no duplicated scene plan;
- existing `match`/`practice` world entry compatibility retained;
- later slices have explicit ownership.

**Status: complete.**

### MG-WP6B — Unified throw and assistance foundation

Deliverables:

- extract deterministic Rainbow Disc rules/profile helpers from scene presentation;
- define Gentle / Standard / Challenge assistance profiles;
- make pointer/touch and keyboard resolve through the same timing-quality rule;
- preserve drag-to-aim and explicit keyboard target selection;
- make throw success/failure explainable by visible aim + release quality;
- add unit coverage for profiles and throw resolution.

Acceptance:

- identical chosen target + release timing produces the same underlying outcome regardless of input device;
- pointer does not bypass timing;
- keyboard is not forced through hidden spatial precision;
- Gentle widens/slows transparently rather than silently converting failures to successes.

**Status: complete / human-approved on 2026-10-06.**

### MG-WP6C — Real short-match loop

Deliverables:

- player/opposition scoreline;
- first-to-two default short match;
- scoring possessions instead of immediate completion after one chain;
- varied attack lane patterns;
- readable defence telegraph;
- turnover/advance/goal transitions;
- final score result and rematch.

Acceptance:

- a Match has a clear beginning, score progression and end;
- both sides can score under deterministic rules;
- defence can be read from a visible cue;
- no hidden cheating/random catch override.

**Status: complete.**

### MG-WP6D — Practice hub and drills

Deliverables:

- Practice hub behind existing `practice` entry;
- Target Range retained and polished;
- Passing Drill;
- Rainbow Streak/accuracy challenge;
- progressive difficulty within drills;
- session-local best score/streak presentation.

Acceptance:

- at least three meaningfully distinct practice loops;
- each run is bounded and quickly replayable;
- modes reuse shared throw rules;
- no adventure progression writes.

**Status: complete.**

### MG-WP6E — Mode/integration and replay polish

Deliverables:

- coherent Match/Practice navigation;
- world pitch still enters Match;
- world practice range still enters Practice;
- Just Games Match/Practice remain valid;
- result/retry/change-mode flows;
- child-readable help and visual feedback;
- regression coverage for world and catalogue return contracts.

Acceptance:

- one canonical scene serves every entry;
- no world-only or Just-Games-only rules fork;
- Back labels/return behaviour remain session-driven.

**Status: complete.**

### MG-WP6F — Responsive/accessibility qualification and human playtest

Deliverables:

- touch target and drag-feel pass;
- keyboard parity pass;
- portrait/tablet containment;
- cue/readability pass;
- final automated qualification;
- human playtest.

Human gate:

- throws feel responsive;
- outcome reasons are understandable;
- Gentle assists without fake play;
- defence is readable;
- Match feels replayable;
- drills feel distinct;
- child wants another go.

Do not merge final WP6 until the human gate is explicitly approved.

## Non-goals

- no racing work;
- no online/multiplayer Rainbow Disc;
- no adventure quest/economy/reward progression;
- no second Rainbow Disc gameplay scene;
- no persistent record system unless separately justified;
- no replacement of the accepted Rainbow Meadow field/practice world layout.

## Verification policy

Run the game-owned unit/browser contracts plus the shared mini-game launch/return contract.

Do not weaken performance or architecture thresholds to make WP6 green. Existing unrelated baseline failures must be identified as baseline rather than “fixed” inside this package unless they block WP6 directly.


## MG-WP6B human acceptance

The first WP6 preview was accepted on 2026-10-06. The shared visible timing model, drag-to-aim behaviour and corrected input parity were considered a good foundation, so implementation proceeded directly into WP6C.

## MG-WP6C implementation checkpoint

The active short-match slice now includes:

- first-to-two scoring;
- persistent player/opposition scoreline during the match;
- three-pass chains score a goal instead of ending the activity;
- authored attack lane patterns rotate between possessions;
- turnovers hand possession to the opposition;
- opposition attacks expose a visible blue route shimmer;
- correct defensive reads intercept and regain possession;
- two missed defensive reads allow the opposition to score;
- match completion supports either side reaching the target;
- result presentation reports the final score;
- browser qualification covers a two-goal player win and an opposition goal path.


## MG-WP6D implementation checkpoint

Practice now opens a single in-scene hub rather than a second gameplay scene.

Implemented drills:

- **Target Range** — the original five-throw range, retained and moved behind the hub;
- **Passing Drill** — six open-lane reads using the shared aim/timing rules;
- **Rainbow Streak** — eight called-target throws with a progressively tighter timing profile.

Session-local best target score and streak values are shown in the hub. No durable adventure or mini-game progression is written.

## MG-WP6E implementation checkpoint

Integration/replay polish now includes:

- player-selectable **Gentle / Standard / Challenge** assistance;
- a Match pre-game assistance screen;
- assistance controls inside the Practice hub;
- first-to-two Match rematch and Change Level flow;
- Practice Again and Practice Menu result flow;
- explicit Just Games browser coverage for Match and Practice;
- preservation of Rainbow Meadow Match and Practice entry points;
- one canonical `RainbowDiscActivityScene` for every path.

## MG-WP6F qualification

Automated coverage now includes:

- deterministic assistance, match and practice-rule unit tests;
- player and opposition scoring paths;
- readable defence telegraph;
- all three Practice drills;
- Match/Practice Just Games launch and return;
- keyboard-only setup/hub navigation;
- representative portrait-tablet canvas containment.

The child-facing human playtest was explicitly approved on 2026-10-06 after the timing, defence-read, Practice fail-rule and branch-first Modes follow-ups. MG-WP6F is complete.


## MG-WP6F human-playtest follow-up — timing challenge behaviour

Human review identified two timing-meter issues:

1. the throw timing marker was still animating while the player was choosing a Match assistance level or Practice drill;
2. the green release window was too static between throws.

Accepted follow-up behaviour:

- the timing meter is inactive/hidden whenever there is no throw to make:
  - Match assistance setup;
  - Practice hub;
  - defence phase;
  - completed/result state;
- the meter becomes active only when the player has an actual disc throw available;
- every throw receives a deterministic timing challenge that can:
  - shift the green release zone left or right;
  - vary the green zone width within safe bounds;
- Gentle / Standard / Challenge still controls the overall forgiveness of that changing window;
- Target Range target difficulty, Passing Drill and Rainbow Streak continue to layer their own intended difficulty over the shared timing challenge;
- release success is judged against the exact visible window centre/width for that throw;
- early/late miss direction is also relative to the current visible window rather than a fixed centre.

Automated qualification now checks that the timing UI is hidden on mode-selection screens and that consecutive throws can present different green-zone position/width values.


## MG-WP6F human-playtest follow-up — defence readability

Human review found that the first defence telegraph was too explicit: a persistent route/arrow effectively told the player which unicorn to select.

Accepted correction:

- remove the persistent arrow to the correct receiver;
- lock defensive input during the read cue;
- briefly animate the intended receiver making a cut;
- show only a partial route shimmer near the thrower rather than a line ending on the answer;
- remove the cue before the player is allowed to choose a lane;
- require the player to remember/read the setup and then commit;
- assistance controls cue clarity:
  - Gentle: longer cue, stronger route shimmer and an additional ring pulse;
  - Standard: medium-duration receiver cut plus partial route shimmer;
  - Challenge: shorter/subtler cue with no answer-highlight ring;
- after a missed defensive read, the next opposition attack provides a fresh read cue.

Automated browser coverage captures the intended lane during the brief cue, waits until the cue has disappeared, and only then makes the defensive choice.


## MG-WP6F human-playtest follow-up — internal mode navigation and Practice fail rules

Human review identified two navigation/clarity issues:

1. Match and Practice could only exit through the source return action, which meant a Just Games launch required returning all the way to the Just Games catalogue just to switch Rainbow Disc mode.
2. Rainbow Streak did not make a wrong target or missed throw feel like a failed streak; it merely reset the streak and continued.

Accepted correction:

- Rainbow Disc owns its own top-level **Modes** chooser;
- Match and Practice both expose a persistent **Modes** action;
- Modes switches between Match and Practice inside the same canonical `RainbowDiscActivityScene`;
- the existing Back action remains the explicit exit to Meadow / Just Games;
- switching internally updates the Rainbow Disc header and mode presentation without relaunching the mini-game.

Practice fail semantics are now explicit:

- **Target Range** — five-throw score challenge; misses consume a throw but do not end the run;
- **Passing Drill** — six-pass training drill; mistakes reset the active streak but do not end the drill;
- **Rainbow Streak** — sudden death; any wrong target or mistimed/missed throw ends the run immediately;
- Rainbow Streak failure result explicitly distinguishes **Wrong target** from **Missed timing**;
- the Practice hub labels Rainbow Streak as sudden death so the rule is visible before starting.

Automated qualification covers active Match -> Modes -> Practice, active Practice -> Modes -> Match, and a deliberate wrong-target Rainbow Streak attempt producing an immediate `STREAK OVER` result without returning to Just Games.


## MG-WP6F human-playtest follow-up — branch-first Modes navigation

Human review found the first internal Modes implementation too abrupt: pressing **Modes** during Match or a Practice drill jumped immediately to the top-level Match/Practice chooser.

Accepted hierarchy:

- while actively playing **Match**, **Modes** returns first to the Match setup / throw-help screen;
- while actively playing a **Practice drill**, **Modes** returns first to the Practice drill hub;
- Match setup and the Practice hub each expose a separate **Match / Practice** action for switching branches;
- the top-level Match/Practice chooser remains inside the same canonical Rainbow Disc scene;
- Back remains the explicit exit to Meadow / Just Games.

This makes Modes act as a one-level-back control within the current branch rather than an immediate cross-branch jump.


## MG-WP6 final human approval

**Approved: 2026-10-06.**

Final human review accepted the completed Rainbow Disc package after the WP6F follow-ups:

- per-throw timing windows vary position and width and remain inactive off-play;
- defence uses a brief read-and-react cue rather than a persistent answer arrow;
- Match and Practice have branch-first internal Modes navigation;
- Rainbow Streak is explicit sudden death on a wrong target or missed timing;
- Match, Practice and all three drills are considered ready to leave the WP6 human gate.

MG-WP6 is complete and may merge. MG-WP7 — Pond Leap expansion is the next mini-game refinement package.
