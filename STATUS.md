# Project Status

Last updated: 2026-09-07

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the game is engaging while exposing release-blocking landscape-tablet usability, stability, functional and world-quality defects.

R6.5-WP18A through WP18G are now complete and merged through PRs #147-#153. WP18F was human-approved on 2026-09-06. WP18G merged to `main` on 2026-09-07 as `d4de16122757122dfeb12dc74898057e35c6538a` after green exact-head validation.

The WP18A approved landscape-tablet direction remains authoritative. The user-requested broader visual tightening/polish pass remains non-blocking backlog work rather than reopening WP18F.

## Current work package

ID: `R6.5-WP18H`

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

State: **waiting for human tablet replay**.

WP18G technical evidence carried into this gate:

- project contract green;
- formatting/lint/type-check and 426 unit tests green;
- production build/static smoke and hard 520 KiB application-entry budget green;
- Chromium/Firefox/WebKit compatibility green;
- full serial Chromium playtest: 164 passed / 3 skipped;
- automated summary: 0 errors, 0 warnings, 2 non-blocking live-object-count suggestions;
- WP18B long-session freeze regressions remain green;
- representative 16:9, 16:10, 4:3, smaller and larger landscape tablet layouts are covered;
- Bag, Map, Creator, orientation recovery, race RUN/JUMP layout and secondary desktop input regressions are green.

## Human gate

WP18H now requires a substantially unguided replay on the reference Samsung Galaxy Tab S8 using Chrome in landscape.

The replay must cover enough of exploration controls, contextual interactions, Bag, Map, Wonderbook, Settings/help, at least one real touch race, the previously frozen surfaces, relevant WP17 functional fixes and the remediated visual/readability areas to make a meaningful judgement.

After WP18H evidence is captured, return to `R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate` for the user's explicit R7-readiness decision.

R7 remains blocked until that explicit WP17 approval.

## Production / deployment

The user explicitly authorised merging WP18G and deploying the resulting remediated build on 2026-09-07.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
