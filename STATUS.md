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

State: **technically complete on PR #153; awaiting merge**.

WP18G delivered:

- explicit canvas gesture suppression without globally breaking DOM text input or modal scrolling;
- live touch-control presentation refresh across landscape/portrait/orientation changes;
- input release before control-presentation rebuild;
- browser-space landscape matrix coverage for 16:9, 16:10, 4:3, smaller and larger tablet shapes;
- Bag/Map/Creator containment checks;
- race control containment and clear central track coverage;
- secondary desktop click-to-move, creator name-entry and race regressions;
- WP18G Chromium/Firefox/WebKit browser health coverage.

Validated implementation head `4f71e843e024b7974405e00f469ea0e359a2180b` is fully green:

- project contract run `34050864146` green;
- CI run `34050864147` green;
- formatting/lint/type-check, 426 unit tests, production build/static smoke and hard 520 KiB budget green;
- Chromium/Firefox/WebKit compatibility green;
- full serial Chromium playtest: 164 passed / 3 skipped;
- automated summary: 0 errors, 0 warnings, 2 non-blocking live-object-count suggestions;
- WP18B long-session freeze regressions remain green.

The only earlier red run was a test-only Playwright timeout caused by repeated browser round-trips in the new viewport matrix. The test was optimised without weakening product assertions and the corrected exact head is green.

## Next eligible work

`R6.5-WP18H - Full Human Tablet Replay and Return to WP17`

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

WP18H starts after PR #153 merges. It is the final real-device human tablet replay gate before returning to WP17 for the explicit R7-readiness decision.

## Remaining remediation sequence

`WP18G merge -> WP18H human replay -> WP17 explicit R7-readiness decision`

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none.

WP18D human gate: none.

WP18E human gate: none.

WP18F human gate: **approved 2026-09-06**, with a non-blocking later tightening pass requested.

WP18G human gate: none; technical acceptance complete.

WP18H human gate: **required** on the reference Samsung Galaxy Tab S8 in Chrome landscape.

R6.5-WP17 R7-readiness remains blocked until WP18H completes another full tablet playthrough and the user then makes the explicit WP17 readiness decision.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
