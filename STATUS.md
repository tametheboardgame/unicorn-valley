# Project Status

Last updated: 2026-09-06

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the game is engaging while exposing release-blocking landscape-tablet usability, stability, functional and world-quality defects.

R6.5-WP18A through WP18D are complete and merged through PRs #147-#150. The WP18A approved landscape-tablet direction remains authoritative for tablet UI work.

## Current work package

ID: `R6.5-WP18E`

Path: `docs/work-packages/R6.5-WP18E-BAG-MAP-CREATOR-MODAL-TABLET-UX.md`

Branch: `agent/r6.5-wp18e-bag-map-creator-modal-tablet-ux`

PR: #151

State: **complete and delivery-ready**.

WP18E delivered:

- scalable Bag pockets for Food, Quest, Decor and Keepsakes;
- touch-safe scrolling for inventories larger than six items;
- selected-item details with explicit quantity/state/action presentation;
- safe Food use with a bounded 45-second 1.18x exploration speed boost and no quest-critical consumption;
- no Food-effect stacking and preservation of the existing 1.6x Gallop cap;
- distinct Map shell access and standalone Map presentation while preserving discovery/progression rules;
- progressive Unicorn Creator categories: Main, Colours, Mane & Tail, Horn, Markings and Accessories;
- preservation of naming input isolation, existing-profile editing, save/cancel/reset behaviour and large preview;
- regression alignment for the intended tablet interaction model without restoring hidden compatibility controls;
- audit of major modal surfaces against the landscape readability, overflow and touch contract.

Validated implementation head: `5c848ea33d62944c80a153608f9e9ecf4f9b106d`.

Exact-head validation is green for:

- AI project operating contract;
- formatting and lint;
- type-check;
- unit tests;
- production build and static smoke;
- hard **520 KiB** application-entry budget;
- Chromium/Firefox/WebKit compatibility;
- full Chromium automated playtest.

The final lifecycle regression correction only made the Hollow Tree Nook stress test return the player to the authored exit range before activating the real exit. It did not weaken timeouts, runtime behaviour or production code.

## Next eligible work

`R6.5-WP18F - World Consistency, Visual Quality and Experience Improvements`

Path: `docs/work-packages/R6.5-WP18F-WORLD-CONSISTENCY-VISUAL-EXPERIENCE.md`

Start from the merged WP18E SHA.

WP18F introduces authoritative recurring-character presence with Nova as the initial proof, removes placeholder-like world representations, improves unicorn mane/neck presentation, Shell Cove identity, crystal readability and shop place quality, while preserving successful Rainbow Meadow, Whispering Woods and Tree Nook identity. Its human gate is bounded visual spot-checks.

## Remaining remediation sequence

`WP18F -> WP18G -> WP18H -> WP17 explicit R7-readiness decision`

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none.

WP18D human gate: none.

WP18E human gate: none.

WP18F human gate: visual spot-checks.

Full human confirmation remains WP18H. R6.5-WP17 R7-readiness remains blocked until WP18H completes another full tablet playthrough.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
