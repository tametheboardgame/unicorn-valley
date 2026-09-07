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

State: **bounded remediation implementation complete / latest exact-head automated validation in progress / human visual approval pending**.

Implementation branch: `work/r6.5-wp18j-bag-map-book-polish`

Draft PR: #158, stacked on WP18I PR #156.

First validated WP18J game-code head: `e44141dac0f20908501168758415bc0ec979e664`.

Latest remediation implementation includes:

- simplified Bag/Map scene-owned framing and removal of repeated stitch/dash treatments;
- removal of the obsolete R6 production-frame overlay from Inventory/Map and Wonderbook, eliminating the duplicate dotted/gold/purple frame and the stale `MY BAG` / `ADVENTURE SCRAPBOOK` labels;
- Wonderbook section navigation moved to five page-edge filing/index tabs with no spine crossing and a restrained directional page-skip transition;
- corrected Map/Bag/Book/Settings icon-label alignment plus normalised Settings and Shimmer icon scale.

Cloudflare branch preview: `https://work-r6-5-wp18j-bag-map-book.unicorn-valley.pages.dev`

### Authorised remediation scope

The 2026-09-07 Galaxy Tab S8 Chrome landscape review identified four remaining presentation issues. These are explicitly part of WP18J and must be fixed before another human visual gate:

- **Bag frame cleanup:** simplify excessive borders/stitching so decorative lines no longer crowd or cross category controls, Close or Shop; retain the magical satchel identity and all existing behaviour.
- **Map frame cleanup:** simplify excessive borders so title/Close/map content sit in clean space; preserve all topology, routing, labels and guidance exactly.
- **Wonderbook index navigation:** keep the successful open-book treatment but replace the top-floating section controls with filing/index tabs on the outer page edges; no tab may cross the book spine.
- **Existing in-game HUD alignment:** correct icon/label alignment in Map, Bag, Book and Settings and tighten alignment of the Shimmer/location pills; preserve the existing shell structure, actions and hit targets.

This is a presentation/layout remediation only. It does not authorise gameplay, save, progression, map-topology, inventory-semantic, input-semantic, settings-behaviour, creator/title, collision or world-art changes.

Approved visual identities remain:

- Bag = magical satchel/saddlebag with restrained pocket, stitch, tag and compartment cues;
- Map = magical quest/adventure map with parchment, compass and cartographic cues;
- Wonderbook = friendly enchanted spellbook/storybook with a coherent open-book spread and page-edge index navigation;
- top HUD = concept-grade buttons/status pills with consistent icon/text alignment.

### Previous WP18J validation result

The first implementation remains the regression baseline for the remediation:

- project contract, format, lint, TypeScript, unit tests, production build, static smoke and the hard 520 KiB application-entry budget passed;
- Chromium, Firefox and WebKit compatibility passed;
- the serial Chromium suite completed with 155 passed, 13 failed, 3 skipped and 3 not run;
- the stacked WP18I baseline completed the same suite with 154 passed, 14 failed, 3 skipped and 3 not run;
- WP18J introduced **zero new aggregate browser failures** and one unrelated baseline performance failure no longer reproduced;
- both Wonderbook progress/filter regressions passed on the validated WP18J game-code head;
- the Bag scroll/food regression and distinct Map surface regression passed on the validated WP18J game-code head;
- the remaining 13 aggregate failures were inherited WP18I/pre-remediation test assumptions, primarily legacy HUD/Settings diagnostics and related timeouts, rather than WP18J regressions;
- automated playtest summary reported 10 scenarios, 0 errors, 0 warnings and 3 existing high-object-count suggestions.

The latest remediation must complete exact-head validation before the next human visual gate. Do not infer completion from the earlier validated head.

Human gate for WP18J: **re-run visual spot-check after remediation before merge/deployment**.

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
- WP18J remediation may change only Bag/Map/Wonderbook presentation plus the explicitly authorised existing-HUD alignment correction.

## Production / deployment

The user explicitly authorised merging WP18G and deploying the resulting remediated build on 2026-09-07.

No production deployment of WP18I or WP18J is authorised yet. Future production deployment still requires explicit user approval.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
