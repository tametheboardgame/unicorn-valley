# Project Status

Last updated: 2026-09-06

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the underlying game is engaging, while identifying release-blocking landscape-tablet usability, freeze/stability, functional and world-quality defects.

R6.5-WP18A is complete and merged through PR #147. R6.5-WP18B is complete and merged through PR #148. R6.5-WP18C is complete and merged through PR #149. The user's approved WP18A tablet direction remains authoritative for WP18E.

## Current work package

ID: `R6.5-WP18D`

Path: `docs/work-packages/R6.5-WP18D-PLAYTHROUGH-FUNCTIONAL-BUG-REGRESSION-REMEDIATION.md`

Branch: `agent/r6.5-wp18d-functional-regression-remediation`

PR: #150

State: **complete and delivery-ready pending final exact-head validation**.

WP18D delivered the bounded human-playthrough functional remediation:

- Echo now uses the shared ambient resident runtime, with direct tap and contextual E/Enter routed through the same activation authority;
- Fern moved off the duplicate visual-only bridge path onto the same shared resident runtime;
- Maple now follows a reachable bakery-approach route with stronger interaction discoverability while preserving exploration;
- Moonflower Cottage has an explicit closed room perimeter while retaining the intended exit approach;
- decoration inventory quantity is authoritative ownership, placement does not consume ownership, multi-copy placement is bounded by owned quantity, clearing/replacing affects placement only, and legacy over-placement is repaired without a save-schema change;
- point-and-click movement keeps velocity on the safe path while facing the final clicked destination, preventing waypoint-driven direction flicker;
- Shimmer reward feedback now states amount earned and resulting balance;
- general shop feedback distinguishes first ownership from repeat purchases;
- repeatable Bakery stock now visibly retains owned quantity after purchase (`×1`, `×2`, etc.) so a successful purchase cannot redraw as if nothing happened;
- the earlier Willow/Marigold/Pebble prototype-marker cleanup was revalidated: hidden topology fixtures remain hidden and production character sprites remain the visible world representation.

Implementation and regression detail: `docs/work-packages/R6.5-WP18D-IMPLEMENTATION-NOTES.md`.

Core exact-head validation on the latest implementation sequence is green for:

- AI project operating contract;
- formatting and lint;
- type-check;
- unit tests, including repeat Bakery ownership feedback and decoration state regressions;
- production build and static smoke;
- hard **520 KiB** application-entry budget;
- Chromium/Firefox/WebKit compatibility.

The first WP18D full browser run exposed one marginal performance-guard failure in Rainbow Meadow: settled p95 187.2 ms against the 180 ms runner-baseline ceiling. All generated functional scenarios passed with zero errors and zero warnings. The performance guard is not being weakened; the final exact-head browser result remains the merge authority.

## Approved tablet direction

Landscape tablet remains the primary interface authority, using the approved WP18A concepts for hierarchy, placement and touch ergonomics.

The durable race clarification remains:

- RUN and JUMP only;
- no left/right steering;
- no separate race Gallop;
- RUN lower-left;
- JUMP lower-right;
- simultaneous RUN + JUMP;
- central track unobstructed;
- no Chrome long-press dependency.

## Next eligible work

`R6.5-WP18E - Bag, Map, Creator and Modal Tablet UX`

Path: `docs/work-packages/R6.5-WP18E-BAG-MAP-CREATOR-MODAL-TABLET-UX.md`

Start after PR #150 merges.

WP18E applies the approved landscape-tablet design language to growing inventory, useful Food interactions, distinct Map access, progressive-disclosure Unicorn Creator controls and the major child-facing modal surfaces.

## Remaining WP17 remediation themes after WP18D

- Bag scalability and Food usability;
- Map and Creator tablet UX;
- modal text, scrolling and overflow consistency;
- mutually exclusive recurring-character presence;
- world consistency and selected visual-quality issues;
- cross-device tablet hardening;
- final full human tablet replay.

Positive evidence to preserve includes Rainbow Meadow, Whispering Woods, Tree Nook/mushrooms, the Firefly activity, earning/spending/discovery/quest loops, tap-to-move and the daughter's willingness to play again.

Canonical remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none.

WP18D human gate: none.

Full human confirmation remains WP18H. R6.5-WP17 R7-readiness acceptance remains pending and cannot be reconsidered until WP18H completes another full tablet playthrough.

## Blockers

- R7 remains intentionally blocked by unreleased R6.5-WP17.
- No human blocker exists for WP18D merge once final exact-head automated validation is green.
- WP18E depends on the merged WP18D baseline.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
