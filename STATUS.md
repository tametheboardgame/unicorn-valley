# Project Status

Last updated: 2026-09-06

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the game is engaging while exposing release-blocking landscape-tablet usability, stability, functional and world-quality defects.

R6.5-WP18A through WP18F are complete and merged through PRs #147-#152. WP18F merged at `a9d6125330fcc5f3f87be15af2ad31eabcb610bb` after the 2026-09-06 human visual approval and a fully green exact-head validation run. The WP18A approved landscape-tablet direction remains authoritative for tablet UI work.

The user explicitly wants another broader visual tightening/polish pass later. That remains retained as non-blocking backlog work rather than reopening WP18F.

## Current work package

ID: `R6.5-WP18G`

Path: `docs/work-packages/R6.5-WP18G-TABLET-DEVICE-HARDENING-CROSS-INPUT-REGRESSION.md`

Branch: `agent/r6.5-wp18g-tablet-device-hardening`

State: **in progress**.

WP18G hardens the completed tablet-first experience across realistic landscape tablet aspect ratios and secondary desktop/browser input without redesigning already-approved UI.

Initial audit findings:

- existing race RUN/JUMP controls already release correctly on pointer cancel/leave, blur, visibility loss and page lifecycle changes;
- existing exploration touch controls already release movement/Gallop on blur, visibility loss and pointer exit/up-outside;
- the page already opts into `viewport-fit=cover`, and safe-area CSS is already present;
- browser compatibility already covers Chromium/WebKit tablet-touch projects but not the current WP18 tablet shell hardening matrix;
- exploration `TouchMovementPad` chooses portrait versus landscape presentation only when it is constructed, so a live orientation cycle can retain the wrong presentation. WP18G will cover and fix this rather than rewriting the input model;
- the game canvas has no explicit `touch-action` rule even though touch control DOM elements do. WP18G will test browser gesture interference and only add broader gesture suppression if evidence requires it;
- 4:3 tablet scaling makes browser-space target size more important than logical Phaser dimensions, so the matrix will assert rendered/browser-space usability rather than logical sizes alone.

Planned evidence matrix:

- 16:9 landscape tablet;
- 16:10 reference-style landscape tablet;
- 4:3 landscape tablet;
- smaller and larger landscape tablet variants where useful;
- landscape race control containment and visibility;
- live landscape/portrait/orientation-cycle stability;
- hybrid touch capability plus secondary desktop keyboard/mouse behaviour;
- compact Chromium/Firefox/WebKit tablet compatibility smoke;
- existing long-session/freeze regression suites and hard 520 KiB budget remain mandatory rather than duplicated.

## Next eligible work

`R6.5-WP18H - Full Human Tablet Replay and Return to WP17`

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

WP18H starts only after WP18G is technically complete. It is the final full human tablet replay gate before returning to WP17 for the explicit R7-readiness decision.

## Remaining remediation sequence

`WP18G -> WP18H -> WP17 explicit R7-readiness decision`

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none.

WP18D human gate: none.

WP18E human gate: none.

WP18F human gate: **approved 2026-09-06**, with a non-blocking later tightening pass requested.

WP18G human gate: none.

Full human confirmation remains WP18H. R6.5-WP17 R7-readiness remains blocked until WP18H completes another full tablet playthrough.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
