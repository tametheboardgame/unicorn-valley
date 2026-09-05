# Project Status

Last updated: 2026-09-05

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest has occurred and did not release R7 readiness. It confirmed the game is engaging, but found release-blocking landscape-tablet control/readability problems, several hard freezes and multiple functional/world-quality defects.

Current `main` remediation-plan baseline before WP18A delivery: `ce0ae9da480447b314b83d4454f4ecb67352f1a5`.

## Active work package

ID: `R6.5-WP18A`

Path: `docs/work-packages/R6.5-WP18A-LANDSCAPE-TABLET-UX-CONCEPT-APPROVAL.md`

State: **human visual gate approved; delivery in progress**.

Branch: `agent/r6.5-wp18a-approved-tablet-ux`.

The user explicitly approved the supplied landscape-tablet control-layout concepts on 2026-09-05 and instructed the project to commit them as the implementation plan and begin work.

Durable implementation authority: `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`.

The concepts' expensive 3D rendering is illustrative only. Their layout, hierarchy, touch placement, screen occupation and interaction design are authoritative.

## Approved tablet direction

Exploration:

- compact top Map, Bag, Book and Settings access;
- lower-left circular movement control;
- lower-right large contextual primary action;
- separate Gallop action beside it;
- bottom-centre contextual hint strip;
- tap-to-move/direct tapping remain first-class;
- world remains the dominant visual surface.

Racing:

- lower-left left/right steering;
- lower-right Jump and Gallop;
- compact race position/progress at top;
- Pause top-right;
- central track and upcoming obstacles remain unobstructed;
- no browser-long-press-dependent control behaviour.

Bag/Map:

- clear distinct Map and Bag actions;
- large landscape Bag modal;
- Food, Quest, Decor and Keepsakes category model;
- scrolling inventory with no six-item ceiling;
- large visual items with quantities;
- selected-item detail panel and explicit use/eat action.

Creator:

- large unicorn preview occupying roughly half the screen;
- progressive Main, Colours, Mane & Tail, Horn, Markings and Accessories categories;
- only the active category exposes its options;
- large visual choices;
- clear Back, Randomise and Save Unicorn actions.

Implementation stop rule: if a later implementation cannot reasonably follow these approved layouts, or a technical compromise would materially alter their hierarchy or child usability, stop and ask the user rather than silently drifting from the approved concepts.

## WP17 human playtest outcome

R6.5-WP17 remains open and unreleased.

Release-blocking themes captured from the 2026-09-05 daughter playthrough include:

- landscape controls/UI shell are the largest usability problem on the reference Samsung Galaxy Tab S8;
- race controls obscure the track and Chrome long-press behaviour interrupts RUN;
- hard freezes occurred in Tree Nook and Twinkle and Thread;
- opening the Bag in Sunlit Beach causes a repeatable disappearance/freeze failure;
- Echo cannot be spoken to;
- Moonflower Cottage back-wall collision is wrong;
- cottage decoration state is inconsistent;
- Bag does not scale beyond six visible items;
- Food is not meaningfully usable;
- purchase/reward feedback is unclear;
- Maple was difficult/impossible to find while needed for progression;
- NPC interaction methods are inconsistent;
- recurring characters can appear in mutually exclusive places simultaneously;
- shell text/boxes can overflow and overlap;
- selected character/environment visual issues remain.

Positive evidence that must be preserved:

- Rainbow Meadow appearance was liked;
- Whispering Woods was liked;
- Tree Nook and its mushrooms were strongly liked;
- Firefly activity was loved;
- earning/spending currency, discoveries and questing/unlocking motivated play;
- tap-to-move was independently chosen as the easiest movement method;
- the child said she would play again.

Canonical remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Product direction

Unicorn Valley is now **landscape-tablet-first** for interface/control design.

Reference human-test environment:

- Samsung Galaxy Tab S8;
- current supported Android;
- Chrome;
- landscape orientation.

The Phaser/TypeScript/Vite browser codebase remains authoritative. Desktop keyboard/mouse remains supported secondarily. Do not rewrite the game natively for Android as part of WP18.

## Planned remediation sequence

1. `R6.5-WP18A` - Landscape Tablet UX Concept and Approval: approved, delivery in progress.
2. `R6.5-WP18B` - Freeze Diagnostics, Root Cause and Stability: next.
3. `R6.5-WP18C` - Landscape Tablet Controls and Interaction Shell.
4. `R6.5-WP18D` - Playthrough Functional Bug and Regression Remediation.
5. `R6.5-WP18E` - Bag, Map, Creator and Modal Tablet UX.
6. `R6.5-WP18F` - World Consistency, Visual Quality and Experience Improvements.
7. `R6.5-WP18G` - Tablet Device Hardening and Cross-Input Regression.
8. `R6.5-WP18H` - Full Human Tablet Replay and Return to WP17.
9. Return to WP17 for the user's explicit R7-readiness decision.

## Technical validation

WP18 work must preserve:

- AI project contract;
- formatting, lint and type-check;
- unit tests;
- production build and static smoke;
- hard 520 KiB application-entry performance gate;
- full Chromium playthrough/regression coverage;
- Chromium/Firefox/WebKit compatibility where supported;
- save compatibility unless a bounded migration is necessary and explicitly tested.

Human-observed defects take precedence over earlier automated claims that a surface was already fixed.

## Human acceptance

WP18A human visual acceptance: **approved 2026-09-05**.

R6.5-WP17 R7-readiness acceptance remains pending and cannot be reconsidered until WP18H completes another full tablet playthrough.

## Next eligible work

1. Finish WP18A delivery through its PR and merge once CI/contract checks permit.
2. Start `R6.5-WP18B` immediately afterwards.
3. Diagnose and fix freeze root causes before WP18C shell/control implementation.

## Blockers

- R7 remains intentionally blocked by unreleased R6.5-WP17.
- No current human blocker exists for WP18B.

## Production / deployment

No production deployment is authorised. Production deployment still requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`

Essential project continuity is externalised into GitHub state/docs rather than relying on chat history.
