# Project Status

Last updated: 2026-09-06

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the underlying game is engaging, while identifying release-blocking landscape-tablet usability, freeze/stability, functional and world-quality defects.

R6.5-WP18A is complete and merged through PR #147. R6.5-WP18B is complete and merged through PR #148. The user's approved tablet direction remains authoritative for WP18C/WP18E.

## Current work package

ID: `R6.5-WP18C`

Path: `docs/work-packages/R6.5-WP18C-LANDSCAPE-TABLET-CONTROLS-INTERACTION-SHELL.md`

Branch: `agent/r6.5-wp18c-landscape-tablet-shell`

PR: #149

State: **complete and delivery-ready pending merge**.

WP18C delivered the approved landscape-tablet exploration/race control hierarchy and shared interaction shell:

- compact Map / Bag / Book / Settings top navigation;
- Shimmer and location status;
- large lower-left exploration D-pad plus separate Gallop;
- large lower-right contextual action;
- bottom-centre child-facing hint;
- direct target tapping routed through authoritative interaction handling;
- first-class tap-to-move retained;
- safe input release across pause, pointer cancellation, focus loss and visibility changes;
- tablet-facing Map and Settings paths;
- race surface reduced to the approved **RUN lower-left + JUMP lower-right only**;
- no race steering and no separate race Gallop;
- simultaneous RUN + JUMP support;
- old landscape bottom race deck removed so the track remains dominant;
- browser long-press/context-callout suppression for required race controls;
- explicit tablet race Pause / Resume / assistance controls.

Exact-head validation on implementation head `456f721c78bbfe1ccf734745415dd380c48763b3` is green:

- AI project operating contract: pass;
- formatting, lint and type-check: pass;
- unit tests: pass;
- production build and static smoke: pass;
- hard **520 KiB** application-entry budget: pass;
- Chromium/Firefox/WebKit compatibility: pass;
- full Chromium playtest: **150 passed, 3 intentionally skipped**;
- target-tablet creator/exploration/Book/accessibility flow: pass;
- target-tablet simultaneous RUN + JUMP flow: pass;
- target-tablet Pause/Resume/assistance flow: pass;
- WP18B Beach/Hollow Tree/Twinkle stability regressions remain green.

Automated playtest summary: 10 scenarios, 0 errors, 0 warnings, 2 non-blocking performance suggestions concerning high decorative object counts in Moonflower Glade and Rainbow Meadow.

## Approved tablet direction

Landscape tablet remains the primary interface authority, using the approved WP18A concepts for hierarchy, placement and touch ergonomics.

The durable race clarification is now recorded in the canonical authority/decision material:

- RUN and JUMP only;
- no left/right steering;
- no separate race Gallop;
- RUN lower-left;
- JUMP lower-right;
- simultaneous RUN + JUMP;
- central track unobstructed;
- no Chrome long-press dependency.

## Next eligible work

`R6.5-WP18D - Playthrough Functional Bug and Regression Remediation`

Path: `docs/work-packages/R6.5-WP18D-PLAYTHROUGH-FUNCTIONAL-BUG-REGRESSION-REMEDIATION.md`

Start only after PR #149 merges.

Initial code inspection has already produced high-value WP18D leads:

- Echo is represented in population/presentation content but does not have an equivalent authoritative interaction route, matching the human report that Echo cannot be spoken to;
- the Moonflower Cottage collision map lacks a true back-wall blocker;
- Maple's outdoor placement is poorly aligned with Bakery discoverability;
- repeatable Bakery purchases do not clearly surface owned quantity;
- economy reward reconciliation can award Shimmer without surfacing the resulting reward feedback;
- decoration ownership/placement logic should be rechecked against the human-observed inconsistent placement/removal/inventory behaviour rather than assumed fixed from older unit coverage.

These are investigation leads, not completed fixes. WP18D must reproduce and regression-test the relevant human-visible failure modes where practical.

## Remaining WP17 remediation themes after WP18C

- Echo interaction;
- Moonflower Cottage back-wall collision;
- cottage decoration state;
- Bag scalability and Food usability;
- purchase/reward feedback;
- Maple discoverability;
- inconsistent NPC interaction methods;
- mutually exclusive recurring-character presence;
- shell/modal text and overflow outside the new shared exploration shell;
- selected visual and facing issues.

Positive evidence to preserve includes Rainbow Meadow, Whispering Woods, Tree Nook/mushrooms, the Firefly activity, earning/spending/discovery/quest loops, tap-to-move and the daughter's willingness to play again.

Canonical remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none. Full human confirmation remains WP18H.

R6.5-WP17 R7-readiness acceptance remains pending and cannot be reconsidered until WP18H completes another full tablet playthrough.

## Blockers

- R7 remains intentionally blocked by unreleased R6.5-WP17.
- No current human blocker exists for WP18D once WP18C merges.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
