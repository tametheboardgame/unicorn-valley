# Project Status

Last updated: 2026-09-06

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation

## Accepted baseline

R0 through R6 are complete. R6.5-WP1 through WP16 are integrated on `main`.

WP17 human playtest did not release R7 readiness. It confirmed that the game is engaging while exposing release-blocking landscape-tablet usability, stability, functional and world-quality defects.

R6.5-WP18A through WP18E are complete and merged through PRs #147-#151. WP18E merged at `1ea5268c09d8e669057eec3c391dd2a020247cc5`. The WP18A approved landscape-tablet direction remains authoritative for tablet UI work.

## Current work package

ID: `R6.5-WP18F`

Path: `docs/work-packages/R6.5-WP18F-WORLD-CONSISTENCY-VISUAL-EXPERIENCE.md`

Branch: `agent/r6.5-wp18f-world-consistency-visual-experience`

PR: #152

State: **complete and human-approved; final exact-head validation/merge in progress**.

WP18F delivered:

- authoritative recurring-character presence with Nova as the initial proof, resolving her to exactly one of Rainbow Run host, Picnic Hill attendee or Moonflower Cottage visitor;
- matching Rainbow Meadow interaction authority so Nova cannot remain interactable at the race hub while authoritatively elsewhere;
- production character bodies in place of duplicate/placeholder-like Nova and cottage-visitor world representations;
- reusable NPC mane/neck coverage plus a saved-appearance-aware player mane coverage layer across production poses;
- lazy loading for the player mane layer so the hard application-entry budget remains unchanged;
- stronger Shell Cove enclosure and shell identity plus a bounded unicorn sandcastle detail;
- recognisable Crystal Brook crystal clusters and a clearer Prism Grotto destination treatment;
- distinct bakery, Twinkle & Thread and story-shop exterior props in Sunbeam Village;
- restrained magical atmosphere additions in Whispering Woods without replacing its liked baseline;
- one lightweight `Say hello` interaction for the Hollow Tree Nook mushrooms.

Validated implementation/evidence head: `4971da091ea64a4a3a87a7f28dffeb320ddd7a83`.

Technical evidence on that exact head is green:

- AI project operating contract, run `34043886843`;
- formatting and lint;
- type-check;
- **426 unit tests**;
- production build and static smoke;
- hard **520 KiB** application-entry budget;
- Chromium, Firefox and WebKit compatibility;
- full Chromium automated playtest, run `34043886844`: **158 passed, 3 skipped**, including all five dedicated WP18F evidence scenarios;
- automated playtest summary: **0 errors, 0 warnings, 2 non-blocking suggestions**.

Human visual spot-check: **approved 2026-09-06**. The approval is sufficient to close WP18F and proceed, but the user explicitly wants another broader visual tightening/polish pass later. That follow-up is non-blocking for WP18F/WP18G and should be retained in the backlog rather than treated as completed forever.

## Next eligible work

`R6.5-WP18G - Tablet Device Hardening and Cross-Input Regression`

Path: `docs/work-packages/R6.5-WP18G-TABLET-DEVICE-HARDENING-CROSS-INPUT-REGRESSION.md`

WP18G may start once PR #152 is merged.

## Remaining remediation sequence

`WP18F merge -> WP18G -> WP18H -> WP17 explicit R7-readiness decision`

## Human acceptance

WP18A visual acceptance: **approved 2026-09-05**.

WP18B human gate: none.

WP18C human gate: none.

WP18D human gate: none.

WP18E human gate: none.

WP18F human gate: **approved 2026-09-06**, with a non-blocking later tightening pass requested.

Full human confirmation remains WP18H. R6.5-WP17 R7-readiness remains blocked until WP18H completes another full tablet playthrough.

## Production / deployment

No production deployment is authorised. Production deployment requires explicit user approval.

## Non-negotiable technical guardrail

The application-entry performance budget is **520 KiB**. Do not weaken or increase it.

## Night Shift

State: `not_configured`

## Chat disposition

`keep`
