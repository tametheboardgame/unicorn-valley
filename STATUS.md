# Project Status

Last updated: 2026-09-05

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

Current accepted `main` baseline after WP16 merge: `a424ec9f50be2d83b2a7c246e5735d9e24274480`.

WP17 human playtest has now occurred. It produced strong evidence that the underlying game is engaging, but it did **not** release the R7 readiness gate because major landscape-tablet control/readability blockers, several hard freezes and multiple functional/world-quality defects remain.

## Active work package

ID: `R6.5-WP18A`

Path: `docs/work-packages/R6.5-WP18A-LANDSCAPE-TABLET-UX-CONCEPT-APPROVAL.md`

State: `ready / waiting_human_visual_approval`.

Human gate: `visual_concept_approval`.

Goal: create and approve the landscape-tablet-first visual/control direction before implementation work begins.

Required concept surfaces:

1. normal exploration shell;
2. landscape race controls;
3. Bag/inventory plus Map access;
4. Unicorn Creator.

No WP18C shell/control implementation may begin until the user explicitly approves the concept direction.

## WP17 human playtest outcome

R6.5-WP17 remains open and unreleased.

The 2026-09-05 daughter playthrough identified the following release-blocking themes:

- controls/UI shell are the largest usability problem on the reference Samsung Galaxy Tab S8 in landscape;
- race controls obscure the track and a Chrome long-press/navigation gesture interrupts RUN on the tablet, making racing effectively unusable;
- hard freezes occurred in Tree Nook and Twinkle and Thread;
- opening the Bag in Sunlit Beach produces a repeatable failure where everything except the sand disappears and the game freezes;
- Echo cannot be spoken to;
- Moonflower Cottage back-wall collision is wrong;
- cottage decoration placement/removal/inventory state is inconsistent;
- Bag stops being usable beyond six visible items because it does not scroll/page;
- Food can be acquired but not meaningfully used;
- purchase/reward feedback is unclear;
- Maple could not be found while the player was actively seeking her for missions/unlocks;
- NPC interaction method is inconsistent;
- recurring characters can appear in mutually exclusive places simultaneously, with Nova the clearest example;
- shell text/boxes can overflow and overlap;
- several character/environment visual issues remain.

The same playthrough also produced strong positive evidence that must be preserved:

- Rainbow Meadow appearance was liked;
- Whispering Woods was liked;
- Tree Nook and its mushrooms were strongly liked;
- Firefly activity was loved;
- earning/spending currency, discoveries and questing/unlocking motivated play;
- tap-to-move was independently chosen as the easiest movement method;
- the child said she would play again.

Canonical remediation evidence and plan: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Product-direction decision

For interface/control design, Unicorn Valley is now **landscape-tablet-first**.

Reference human-test environment:

- Samsung Galaxy Tab S8;
- current supported Android for that device;
- Chrome;
- landscape orientation.

The existing Phaser/TypeScript/Vite browser codebase remains the product codebase. Desktop keyboard/mouse remains supported as a secondary presentation/input path.

Do **not** rewrite the game natively for Android as part of this remediation. A later optional R6.6 package may evaluate packaging the existing build with Capacitor or an equivalent thin Android wrapper after the tablet-first build is stable and WP17 is accepted.

## Planned remediation sequence

1. `R6.5-WP18A` - Landscape Tablet UX Concept and Approval.
2. `R6.5-WP18B` - Freeze Diagnostics, Root Cause and Stability.
3. `R6.5-WP18C` - Landscape Tablet Controls and Interaction Shell.
4. `R6.5-WP18D` - Playthrough Functional Bug and Regression Remediation.
5. `R6.5-WP18E` - Bag, Map, Creator and Modal Tablet UX.
6. `R6.5-WP18F` - World Consistency, Visual Quality and Experience Improvements.
7. `R6.5-WP18G` - Tablet Device Hardening and Cross-Input Regression.
8. `R6.5-WP18H` - Full Human Tablet Replay and Return to WP17.
9. Return to WP17 for the user's explicit R7-readiness decision.

Detailed sequence: `ROADMAP.md` and `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Technical validation

The accepted WP16 baseline merged green through PR #145.

WP18 remediation must preserve:

- AI project contract;
- formatting, lint and type-check;
- unit tests;
- production build and static smoke;
- hard 520 KiB application-entry performance gate;
- full Chromium playthrough/regression coverage;
- Chromium/Firefox/WebKit compatibility where supported;
- save compatibility unless a bounded migration is necessary and explicitly tested.

Human-observed defects now take precedence over earlier automated claims that the same surface was already fixed.

## Human acceptance

Current human gate: WP18A visual concept approval.

R6.5-WP17 R7-readiness acceptance remains pending and cannot be reconsidered until WP18H completes another full tablet playthrough.

## Recently completed

- R6.5-WP13 Cross-Region and Follow-up Stories merged as `3db374dd48445386819d1da97d4367619f7b9cef`.
- R6.5-WP14 Repeatable Activity Expansion merged as `5d246ae012ef351e9dd356befc3a9608222041e6`.
- R6.5-WP15 Wonderbook, Collections and Long-Term Goals merged as `bdc86e05472d0f061e3b748cc42706cc6541f523`.
- R6.5-WP16 Valley Tidy-up, Balance and Content Polish merged as `a424ec9f50be2d83b2a7c246e5735d9e24274480` through PR #145.
- R6.5-WP17 human playtest evidence captured on 2026-09-05; gate remains unreleased and remediation is required.

## Next eligible work

1. Execute `R6.5-WP18A` concept-image exploration only.
2. Iterate until the user explicitly approves the exploration shell, race controls, Bag/Map and Creator direction.
3. Record the approved design decisions durably.
4. Then begin `R6.5-WP18B` freeze diagnostics/stability.

## Blockers

- R7 is intentionally blocked by unreleased R6.5-WP17.
- WP18C shell/control implementation is blocked by WP18A human visual approval.

## Human decisions required

Immediate: approve/revise the WP18A concept images.

Later: complete WP18H replay and explicitly decide whether WP17 may release R7.

## Production / deployment

No production deployment is authorised by the planning work. Production deployment still requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Fresh-chat resume instruction

A new project chat can resume safely by reading, in order:

1. `PROJECT_STATE.json`;
2. this `STATUS.md`;
3. `ROADMAP.md`;
4. `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`;
5. `docs/work-packages/R6.5-WP18A-LANDSCAPE-TABLET-UX-CONCEPT-APPROVAL.md`;
6. any user-attached concept images already approved or currently under review;
7. current GitHub/main/deployment state.

A fresh chat may be started with: **`Start R6.5-WP18A`**.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`

Essential project continuity is externalised into GitHub state/docs rather than relying on chat history.

## Source-of-truth note

Current repository/code state, this file, `PROJECT_STATE.json`, `ROADMAP.md`, `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md` and the active bounded work package take precedence over stale historical plans, old PR descriptions and remembered conversation context.
