# Project Status

Last updated: 2026-09-05

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Current accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the underlying game is engaging, while identifying release-blocking landscape-tablet usability, freeze/stability, functional and world-quality defects.

R6.5-WP18A is complete and merged through PR #147. The user's approved tablet direction remains authoritative for WP18C onward.

## Current work package

ID: `R6.5-WP18B`

Path: `docs/work-packages/R6.5-WP18B-FREEZE-DIAGNOSTICS-STABILITY.md`

Branch: `agent/r6.5-wp18b-freeze-stability`

PR: #148

State: **complete and delivery-ready pending merge**.

WP18B delivered bounded browser freeze diagnostics, fixed a deterministic long-running-save Bag crash caused by retired inventory IDs, hardened Bag/Shop modal resume sequencing, and added repeated real-flow stress regressions for Starlight Beach, Hollow Tree Nook and Twinkle & Thread.

Exact-head validation on `12bd3090c7a1e73f3ae1d308e8adeefa2dbbb811` is green:

- AI project operating contract: pass;
- formatting, lint and type-check: pass;
- unit tests: pass;
- production build and static smoke: pass;
- hard **520 KiB** application-entry budget: pass;
- Chromium/Firefox/WebKit compatibility: pass;
- full Chromium playtest: **150 passed, 3 intentionally skipped**;
- Starlight Beach 10-cycle Bag stress: pass;
- retired-inventory-ID Beach regression: pass;
- Hollow Tree Nook 8-cycle Bag/re-entry stress: pass;
- Twinkle & Thread 8-cycle Shop/Bag/resume stress: pass.

The exact original daughter-playtest sequences for the Tree Nook and Twinkle freezes were not independently reconstructed. No claim is made that each historical freeze was individually reproduced. The relevant lifecycle paths are now hardened and survive repeated stress with live heartbeat, bounded object/timer/tween counts, no runtime error and no renderer-context loss.

Two earlier WP18B CI failures were trace-confirmed wall-clock test-budget expiries while the scenes remained active and healthy, not reproduced freezes. Coverage was retained and the final exact-head suite completed cleanly.

## Approved tablet direction

Landscape tablet remains the primary interface authority, using the approved WP18A concepts for hierarchy, placement and touch ergonomics.

The user clarified the race-control mechanic on 2026-09-05:

- race controls are **RUN and JUMP only**;
- there is no left/right steering;
- there is no separate race Gallop control;
- RUN belongs in the lower-left thumb zone;
- JUMP belongs in the lower-right thumb zone;
- RUN + JUMP must work simultaneously;
- the central track stays unobstructed;
- held RUN must not trigger Chrome long-press behaviour.

The canonical WP18A authority document and durable decision record must be corrected to reflect this clarification as the first WP18C documentation change.

## WP17 human playtest outcome still requiring remediation

Remaining release-blocking themes include:

- landscape controls/UI shell and readability;
- race control layout/Chrome gesture interference;
- Echo interaction;
- Moonflower Cottage back-wall collision;
- cottage decoration state;
- Bag scalability and Food usability;
- purchase/reward feedback;
- Maple discoverability;
- inconsistent NPC interaction methods;
- mutually exclusive recurring-character presence;
- shell text/box overflow;
- selected visual and facing issues.

Positive evidence that must be preserved includes Rainbow Meadow, Whispering Woods, Tree Nook/mushrooms, the Firefly activity, earning/spending/discovery/quest loops, tap-to-move and the daughter's willingness to play again.

Canonical remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## Next eligible work

1. Merge WP18B through PR #148 after the final documentation-only exact-head checks are green.
2. Start `R6.5-WP18C - Landscape Tablet Controls and Interaction Shell` immediately from the merged baseline.
3. Implement the approved exploration/tablet shell and RUN/JUMP race controls without drifting from the supplied concepts.

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

R6.5-WP17 R7-readiness acceptance remains pending and cannot be reconsidered until WP18H completes another full tablet playthrough.

## Blockers

- R7 remains intentionally blocked by unreleased R6.5-WP17.
- No current human blocker exists for WP18B or the start of WP18C after merge.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
