# Project Status

Last updated: 2026-09-05

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest has occurred and did not release R7 readiness. It confirmed the game is engaging, but found release-blocking landscape-tablet control/readability problems, several hard freezes and multiple functional/world-quality defects.

R6.5-WP18A is complete and merged through PR #147. The user's approved landscape-tablet direction is recorded in `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md` and remains authoritative for WP18C onward.

Current `main` baseline after WP18A: `2aefb4487f12b8eef79b5a4a9b297a7cb39c8ed4`.

## Active work package

ID: `R6.5-WP18B`

Path: `docs/work-packages/R6.5-WP18B-FREEZE-DIAGNOSTICS-STABILITY.md`

State: **in progress; exact-head CI running**.

Branch: `agent/r6.5-wp18b-freeze-stability`.

PR: #148.

WP18B is treating the human-observed hard freezes as release-blocking defects before any production tablet-shell implementation begins.

Current implementation includes:

- bounded rolling browser freeze diagnostics covering scene lifecycle state, frame heartbeat and long frames, object/timer/tween counts, last interaction, runtime errors/rejections, renderer context loss and browser memory where exposed;
- diagnostics installed early enough to observe extended-scene registration/lazy-load failures;
- repeated real-world regressions for Starlight Beach Bag cycling, Hollow Tree Nook re-entry/Bag/movement cycles and Twinkle & Thread shop/Bag/resume cycles;
- assertions that scene object/timer/tween counts remain bounded and the Phaser heartbeat remains live;
- a concrete stale-save fix: Bag inventory enumeration now ignores retired item IDs preserved by older long-running saves instead of throwing during inventory rendering;
- unit and browser coverage for the retired-item failure path.

The normal validation job on the current WP18B head is green, including formatting, lint, type-check, unit tests, production build, the hard 520 KiB application-entry budget and static smoke. Browser compatibility and full browser playtest remain in progress before WP18B can be accepted.

## Approved tablet direction

The approved WP18A concept package remains the implementation authority:

- exploration: world-dominant layout, compact top utility access, lower-left movement, lower-right contextual action plus Gallop, tap-to-move/direct tapping first-class;
- racing: corner controls, unobstructed central track, compact top progress HUD, no browser-long-press-dependent RUN behaviour;
- Bag/Map: distinct access, scalable categories, scrolling inventory, selected-item detail/use actions;
- Creator: dominant preview with progressive Main, Colours, Mane & Tail, Horn, Markings and Accessories categories.

If implementation would materially drift from that hierarchy or child usability, stop for user input rather than silently substituting another design.

## WP17 human playtest outcome

R6.5-WP17 remains open and unreleased.

Release-blocking themes include:

- landscape controls/UI shell are the largest usability problem on the reference Samsung Galaxy Tab S8;
- race controls obscure the track and Chrome long-press behaviour interrupts RUN;
- hard freezes occurred in Tree Nook and Twinkle and Thread;
- opening the Bag in Sunlit Beach caused a repeatable disappearance/freeze failure;
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

Unicorn Valley is landscape-tablet-first for interface/control design.

Reference human-test environment:

- Samsung Galaxy Tab S8;
- current supported Android;
- Chrome;
- landscape orientation.

The Phaser/TypeScript/Vite browser codebase remains authoritative. Desktop keyboard/mouse remains supported secondarily. Do not rewrite the game natively for Android as part of WP18.

## Planned remediation sequence

1. `R6.5-WP18A` - Landscape Tablet UX Concept and Approval: complete and merged.
2. `R6.5-WP18B` - Freeze Diagnostics, Root Cause and Stability: active.
3. `R6.5-WP18C` - Landscape Tablet Controls and Interaction Shell.
4. `R6.5-WP18D` - Playthrough Functional Bug and Regression Remediation.
5. `R6.5-WP18E` - Bag, Map, Creator and Modal Tablet UX.
6. `R6.5-WP18F` - World Consistency, Visual Quality and Experience Improvements.
7. `R6.5-WP18G` - Tablet Device Hardening and Cross-Input Regression.
8. `R6.5-WP18H` - Full Human Tablet Replay and Return to WP17.
9. Return to WP17 for the user's explicit R7-readiness decision.

## Technical validation

WP18 must preserve:

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

1. Finish WP18B root-cause/stress validation and obtain exact-head green CI.
2. Merge WP18B when its acceptance criteria are satisfied.
3. Start `R6.5-WP18C` immediately afterwards using the approved WP18A layouts as authority.

## Blockers

- R7 remains intentionally blocked by unreleased R6.5-WP17.
- WP18C remains blocked until WP18B acceptance is satisfied.
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
