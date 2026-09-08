# Project Status

Last updated: 2026-09-08

## Current work

`R6.5-WP18K - Architecture Consolidation and Legacy Retirement`

Path: `docs/work-packages/R6.5-WP18K-ARCHITECTURE-CONSOLIDATION-LEGACY-RETIREMENT.md`

State: **implementation complete; technical qualification in progress**. David accepted WP19A's bounded qualification, authorised merging/deploying PRs #159/#160 and starting WP18K. Both PRs are merged; the production baseline is main `d8f3de6f264fa5fd6e2d77d539a47f288eb50cd4`. WP18K K1 ownership/removal evidence preceded implementation. K2-K4 consolidated Bag/Map ownership and removed five proven legacy managers/bridges. Core validation passes; current-head compatibility and serial browser CI are running, and David's visual gate remains pending.

Read first:

- `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md`
- `docs/2026-09-08-REMEDIATION-PROPOSAL.md`

## Accepted gameplay baseline

R0-R6 and R6.5-WP1-16 are integrated. WP17 remains open; R7 is blocked. WP18A-G are integrated. WP18I/J were visually approved on 2026-09-08 and integrated through PR #158 / `45c858edc4537d49621a644d8131e0e4affe2f3b`.

Approved game-code head: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`.

Approved immutable preview: `https://8292d7b9.unicorn-valley.pages.dev`.

Audit base main: `d9b765c0293045251619783a4ced4b01068e993a`.

Retain the accepted HUD camera stability, cream/lavender/purple/gold controls, Bag categories/no Shop shortcut, Map drag/North/clipping, Wonderbook page tabs and cross-only close controls. Four display classes remain mandatory.

## Approved next sequence

WP19A persistence safety → WP18K ownership foundation → WP19B world boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F UI consistency/generated title → WP19G/H MP3 audio → WP19I integrated qualification → WP18H daughter replay → WP17 readiness decision.

WP19A-I bounded files are **approved**, subject to their dependencies and human gates. WP19A is next, followed by WP18K. WP18K remains behaviour-preserving; it must not silently absorb functional redesign.

## Important open findings

- Creator crowded on desktop; progressive layout ownership is inconsistent.
- Legacy E/Enter/tap labels remain visible beneath world objects.
- Roaming residents and scene targets use separate interaction/feedback routes.
- Cottage back-wall/window collision remains unresolved.
- Grotto/Grove are absent from the preferred tap-navigation support list.
- WP19A guards title and boot-manager storage reads, prevents rejected writes from producing purchase success, requires primary success where checkpoints are unsupported, and keeps post-commit listener faults from inviting a duplicate charge. Exact-head package qualification passes; the cancelled integrated browser baseline remains assigned to WP19I.
- New-game Map shows Cottage as current while the player is in Glade; investigate checkpoint/location consistency.
- Generated title image and MP3 catalogue/playback are new work, not already delivered features.

Full evidence, severity and source references are in the audit. Source risks are distinguished from runtime reproductions.

## Validation

- Local baseline `npm run validate`: passing, 113 test files / 427 tests plus format/lint/type/build/performance/static checks.
- Two temporary storage fault tests confirmed the documented defects; removed from the repository after diagnosis.
- Live-browser checks covered title, creator, naming/start, tap movement, Pip dialogue, Bag and Map. No full daughter-style replay is claimed.
- Main CI run `34210921262`: Validate and Browser compatibility succeeded; Browser playtest subsequently ended **cancelled**. Main does not have complete green full-playtest evidence from that run.
- Local Chromium was initially missing, then installed successfully. The serial broad suite stopped at its three-failure limit: 23 passed, 3 failed, 155 did not run. The failures assert historical suggestion cards and a retired controls button. The separate current R6.5 suite finished with 34 passed, 5 failed and 21 not run. Failures cover stale Bag coordinates/wrapper assertions, Nook/race total-budget timeouts, and a numerical Bag size failure. Trace-based distinctions and unverified coverage are in the audit addendum.
- Documentation project-state validation, formatting and whitespace checks pass on the final handoff changes. Overall browser qualification remains failing/incomplete.
- WP19A corrected-head `npm run validate` passes with 114 test files / 435 tests and a 480.38 KiB entry bundle; the focused SaveService run passes 22 tests. The matching Chromium download completed, but host libraries remain unavailable, so the new denied-getter browser regression awaits CI. No full-green browser qualification is claimed.
- CI run `34222463247` on the preceding head passed Validate and Browser compatibility. Browser playtest was cancelled at 35 minutes after the package-relevant main-menu, profile and save-recovery groups passed; unrelated historical UI failures and integrated qualification remain open in their planned packages.
- CI run `34231264234` on `bec98fa` passed Validate and Browser compatibility, but its timed browser job exposed a package-relevant failure in the new denied-storage title regression. Its trace showed boot-time Continue restore, Pip egg, atmosphere/weather and reward initialisation still calling the throwing legacy load path before Title could render. Commit `8a6d35e` routes those passive boot reads through typed outcomes; the complete five-case save-recovery browser spec now passes locally.
- CI run `34237540616` on exact head `4b6b742` passed Validate, browser compatibility and all five save-recovery cases; project-contract run `34237540863` passed. The broad job was cancelled at 35 minutes with 136 passes, 20 failures, 3 skips and 23 unfinished cases, so overall CI is not green. All 20 failures match the preceding-head run individually and are outside persistence scope. A bounded run closed the unfinished group with 17 passes and 6 explicit UI-scope failures. See `docs/evidence/R6.5-WP19A-BROWSER-QUALIFICATION.md`.

## Human feedback and gates

Original evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

Current ledger: `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md`.

No new daughter replay occurred. Preserve all positive feedback and deferred ideas. WP18H remains the physical Galaxy Tab S8 replay; WP17 requires David's explicit readiness decision. R7 remains blocked.

## Delivery

WP19A planning PR #159 and implementation PR #160 are accepted and merged to
main `d8f3de6`; David authorised that production deployment. WP18K is delivered
as draft PR #161 from `agent/r6.5-wp18k-architecture-consolidation` against
main. Exact implementation preview: `https://cf10dee8.unicorn-valley.pages.dev`
for `ff444db`. Exact current documentation-head preview:
`https://c1888d5c.unicorn-valley.pages.dev` for `f16f2e7`. No WP18K merge or
production deployment is authorised.

## Next action

Review current-head browser/compatibility CI and classify every failure, skip or
unfinished case against the WP19A ledger. When technical evidence is complete,
David checks the immutable preview across the four display classes using the
package checklist. Stop at that visual gate. The next approved package after K
is WP19B; full integrated closure remains WP19I.

## Implementation delivery

Branch: `agent/r6.5-wp18k-architecture-consolidation`, based on current main.
Draft PR: https://github.com/tametheboardgame/unicorn-valley/pull/161.

## Codex execution

WP18K started from verified main `d8f3de6`; no prior WP18K branch, PR or worker
was present. K1-K4 and the current K5 checkpoint are committed and pushed. The
runner can execute local browsers after supported dependencies were installed,
but its HTTP CONNECT proxy blocks Cloudflare Pages hosts with 403, so production
and immutable-preview browser smokes require external verification. CI remains
running for the final documentation head.
