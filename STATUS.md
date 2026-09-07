# Project Status

Last updated: 2026-09-07

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the game is engaging while exposing release-blocking landscape-tablet usability, stability, functional and world-quality defects.

R6.5-WP18A through WP18G are complete and merged through PRs #147-#153. WP18F was human-approved on 2026-09-06. WP18G merged to `main` on 2026-09-07 as `d4de16122757122dfeb12dc74898057e35c6538a` after green exact-head validation.

The 2026-09-07 production inspection established that the touch mechanics were substantially improved but the HUD/button/text-box presentation still fell materially short of the user-approved high-fidelity Rainbow Meadow concept. R6.5-WP18I therefore became the bounded global UI remediation pass.

WP18I implementation is currently represented by draft PR #156 on `agent/r6.5-wp18i-concept-grade-ui`. Subsequent visual review established that Bag, Map and Wonderbook require one further tightly bounded themed pass rather than reopening the wider shell.

## Current work package

ID: `R6.5-WP18J`

Path: `docs/work-packages/R6.5-WP18J-BAG-MAP-BOOK-THEMED-POLISH.md`

State: **implementation complete on stacked branch / automated validation and human visual approval pending**.

Implementation branch: `work/r6.5-wp18j-bag-map-book-polish`

Base: `agent/r6.5-wp18i-concept-grade-ui` / WP18I PR #156.

Hard scope: **Bag, Map and Wonderbook only**.

Approved visual identities:

- Bag = magical satchel/saddlebag with restrained pocket, stitch, tag and compartment cues;
- Map = magical quest/adventure map with parchment, compass and cartographic cues;
- Wonderbook = friendly enchanted spellbook/storybook with a coherent open-book spread, chapter/ribbon tabs and subtle magical flourishes.

WP18J preserves all underlying inventory, map, discovery, collection, progression, save and input behaviour. It does not authorise new gameplay semantics or another global UI rewrite.

Human gate for WP18J: **visual spot-check required before merge/deployment**.

## Deferred human replay

`R6.5-WP18H - Full Human Tablet Replay and Return to WP17` remains deferred until WP18I/WP18J UI work is integrated and WP18J is visually accepted.

After WP18J approval, WP18H resumes the substantially unguided Galaxy Tab S8 Chrome landscape replay and then returns to WP17 for the explicit R7-readiness decision.

R7 remains blocked.

## Separately known defect

The 2026-09-07 production inspection also reconfirmed that the Moonflower Cottage/window collision remains wrong. That defect is real, but WP18I/WP18J are UI-only, so collision work remains excluded and unresolved for separate remediation before final R7 readiness.

## Technical guardrails

- hard application-entry performance budget remains **520 KiB**;
- existing authoritative interaction/input paths must be reused rather than duplicated;
- desktop keyboard/mouse support remains secondary but supported;
- no new gameplay system is authorised by WP18I or WP18J;
- WP18J may theme only Bag, Map and Wonderbook.

## Production / deployment

The user explicitly authorised merging WP18G and deploying the resulting remediated build on 2026-09-07.

No production deployment of WP18I or WP18J is authorised yet. Future production deployment still requires explicit user approval.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
