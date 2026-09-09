# Project Status

Last updated: 2026-09-08

## Current work

`R6.5-WP18K - Architecture Consolidation and Legacy Retirement`

Path: `docs/work-packages/R6.5-WP18K-ARCHITECTURE-CONSOLIDATION-LEGACY-RETIREMENT.md`

State: **visual-preservation correction implemented; exact-head browser CI remains non-green**. David accepted WP19A's bounded qualification, authorised merging/deploying PRs #159/#160 and starting WP18K. Both PRs are merged; the production baseline is main `d8f3de6f264fa5fd6e2d77d539a47f288eb50cd4`. WP18K K1 ownership/removal evidence preceded implementation. K2-K4 consolidated Bag/Map ownership and removed five proven legacy managers/bridges. K5 has classified exact `5f13cc3` sharded CI (176 passed / 3 failed / 3 configured skips / 0 unrun), traced and corrected the final Nova contextual-action, Lumi production-guidance and landscape race-overlay assertions, and added an authorised GitHub Actions immutable-preview smoke route. Exact candidate CI passed all required shards and compatibility, and the authorised Actions deployed startup/save/reload/Continue smoke passed; delegated manager review remains pending and no physical human acceptance is claimed.

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

WP19A-I bounded files are **approved**, subject to their dependencies and human gates. WP19A is complete and WP18K is active; WP19B follows only after WP18K qualification and its human gate. WP18K remains behaviour-preserving; it must not silently absorb functional redesign.

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

- Exact `5f13cc3` CI run `34292365366` passed Validate (114 files / 435 tests, build/static smoke and 480.01 KiB under the unchanged 520 KiB budget), compatibility (48 passed / 15 configured skips) and project-contract. Its browser shards totalled 176 passed / 3 failed / 3 configured skips / 0 unrun and are not green. The three bounded corrections pass focused checks. Exact candidate `c4697e8` run `34300718194` passed all three browser shards (179 passed / 0 failed / 3 configured skips / 0 unrun), compatibility (48 / 15 configured skips), Validate and project-contract.
- Exact starting-head CI run `34262336206`: Validate passed; project-contract run `34262336101` passed; compatibility passed 48 with 15 configured skips. Browser playtest was cancelled at 35 minutes with 130 passed, 9 failed and 3 skipped, leaving 40 unfinished. It is not represented as green.
- All 40 unfinished cases were attempted in four bounded serial Chromium groups: initial totals 29 passed, 10 failed and 1 serial skip. Ten world-depth cases and all seven WP18J preservation cases passed. Named-control corrections then passed Food, Map and Creator 3/3; remaining trace-led touch/timeout corrections await correction-head CI.
- The complete historical and current dispositions are recorded in `docs/evidence/R6.5-WP18K-BROWSER-QUALIFICATION.md`. The final failures were not waived: Nova now uses its canonical contextual action and return point; production dialogue guidance is protected from the legacy scanner; landscape race geometry tests the accepted corner overlay and real simultaneous controls.
- The local host can run Chromium after supported browser/dependency installation. Its software renderer is materially slower than CI; retained multi-cycle/multi-scene tests use trace-justified total budgets while preserving cycles and responsiveness assertions.
- The local runner HTTP CONNECT proxy still blocks Cloudflare Pages with 403 and was not bypassed. The reusable existing-Actions workflow passed isolated deployed startup/save/reload/Continue qualification in run `34300718207` against immutable preview `https://19e1602a.unicorn-valley.pages.dev`; artifact `10084829132` records the result.

## Human feedback and gates

Original evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

Current ledger: `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md`.

No new daughter replay occurred. Preserve all positive feedback and deferred ideas. WP18H remains the physical Galaxy Tab S8 replay; WP17 requires David's explicit readiness decision. R7 remains blocked.

## Delivery

WP19A planning/implementation PRs #159/#160 are accepted and merged to main `d8f3de6`. WP18K remains draft PR #161 on `agent/r6.5-wp18k-architecture-consolidation`. Cloudflare verified `https://cc5b61db.unicorn-valley.pages.dev` for exact qualified candidate `c4697e8`; the final branch head is state-only documentation after that candidate. UV-D013 authorises the manager to accept, merge and deploy technically qualified WP18K; this correction task remains delivery-only and performs none of those actions.

## Next action

Complete exact-candidate CI/deployment smoke, then delegated manager review should compare `docs/evidence/WP18K-VISUAL-REVIEW-INDEX.md`. The correction restores readable Book filters and cross-only close. Baseline evidence identifies the phone Bag/Settings scaling as inherited WP19F work rather than accepting it as child-sized. This task stops on PR #161 without merge, production deploy or WP19B. Physical daughter/device acceptance is not claimed; WP18H and WP17 remain human-only.

## Implementation delivery

Branch: `agent/r6.5-wp18k-architecture-consolidation`, based on current main.
Draft PR: https://github.com/tametheboardgame/unicorn-valley/pull/161.

## Codex execution

WP18K K1–K4 started from verified main `d8f3de6`. K5 now has a package-specific ledger, exact CI/compatibility counts, all 40 unfinished dispositions and planned-versus-actual scanner ownership. The latest bounded K5 correction closes the final three failures from the 176-pass run without changing dialogue or race mechanics. Exact-head CI and immutable-preview smoke pass; delegated manager review is the next action. The conversation disposition remains `keep` until those external results and manager gate are durable.
