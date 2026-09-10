# Project Status

Last updated: 2026-09-10

## Current work

`R6.5-WP19C - Progressive Unicorn Creator`

Path: `docs/work-packages/R6.5-WP19C-PROGRESSIVE-CREATOR.md`

State: **David's binding 10 September visual addendum implemented; exact-head qualification pending**. Generated card skins share source-object lifetimes; the catalogue contains six real mane/tail/horn choices and eight accessories; marking tiles use the selected body colour; and the name has one adaptive accessible pencil. Final four-class and focused long-name/transition/marking evidence is under `docs/evidence/wp19c-current-head/`. CI `34445609506` passed Validate, compatibility and shard 3 but failed shards 1 and 2. Bounded reproduction corrected shard 2's remaining retired-label test and added new-style save/reload/Continue coverage; shard 1's inaccessible result is not waived. Automatic smoke `34445609498` demonstrably used historical production metadata, so corrected-candidate smoke remains pending. David's visual approval remains pending. No merge, production or WP19D.


## Accepted gameplay baseline

R0-R6 and R6.5-WP1-16 are integrated. WP17 remains open; R7 is blocked. WP18A-G are integrated. WP18I/J were visually approved on 2026-09-08 and integrated through PR #158 / `45c858edc4537d49621a644d8131e0e4affe2f3b`.

Approved game-code head: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`.

Approved immutable preview: `https://8292d7b9.unicorn-valley.pages.dev`.

Audit base main: `d9b765c0293045251619783a4ced4b01068e993a`.

Retain the accepted HUD camera stability, cream/lavender/purple/gold controls, Bag categories/no Shop shortcut, Map drag/North/clipping, Wonderbook page tabs and cross-only close controls. Four display classes remain mandatory.

## Approved next sequence

WP19A persistence safety → WP18K ownership foundation → WP19B world boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F UI consistency/generated title → WP19G/H MP3 audio → WP19I integrated qualification → WP18H daughter replay → WP17 readiness decision.

WP19A-I bounded files are **approved**, subject to their dependencies and human gates. WP19A and WP18K are complete; WP19B is active after production release verification. WP18K remains behaviour-preserving; it must not silently absorb functional redesign.

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

- Documentation-head CI run `34323584335` passed Validate, project-contract, compatibility and browser shards 2/3 and 3/3, but shard 1 recorded 60 passed and 1 failed. The Firefly Lantern replay-unlock case reached the result after only 7/8 catches because synthetic key down/up could occur between Phaser update frames; it then timed out waiting for a selector that correctly remained locked. Candidate `c7fd62f` holds each real key edge until the named transition and passes three focused repetitions. Exact-head CI `34328261135` historically passed 179 browser cases with 3 configured skips and no failures or unrun cases; compatibility passed 48 with 15 configured skips. David’s subsequent preview playtest found that Map drag did not work through real pointer gestures, so that green run is not current qualification evidence. Candidate `aa68c60` gives the parchment a real mouse/touch gesture owner, meaningful overscanned geography and bounded travel, removes redundant Bag/Map badges and Map subtitle, and improves the Wonderbook cross contrast/position. Focused real-input checks pass. Exact-head CI `34340757180` passed 181 browser cases with 3 configured skips, compatibility passed 48 with 15 configured skips, and Validate passed 114 files / 435 tests. Cloudflare published `d781a1a` at `https://38f17b6c.unicorn-valley.pages.dev`; manifest-bound smoke against that candidate is pending (the first workflow run truthfully targeted the previous manifest).
- CI run `34318525681` passed Validate, project-contract, compatibility (48 passed / 15 configured skips) and browser shards 1/3 and 3/3. Shard 2/3 recorded 57 passed, 1 failed and 3 configured skips. Its sole failure timed out waiting for `MoonflowerGladeScene` after tapping the retired bottom Book-close coordinate; the accepted current owner is the named top-right `wonderbook-close-button`, which the corrected real-touch journey now uses. Exact-head CI must pass before qualification is claimed.
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

WP18K is human-approved, technically qualified and merged through PR #161 at main `250f0855f013f4ba54a6de4056181cf5affa0d57`. Cloudflare reports immutable deployment `https://7a667b82.unicorn-valley.pages.dev` for that merge SHA. WP19B uses `agent/r6.5-wp19b-world-boundaries-navigation` and must remain a draft PR through its separate UV-D014 human collision/visual gate.

## Next action

Commit and push the qualification correction, obtain green exact-head CI, bind startup/save/reload/Continue smoke to that immutable candidate, and stop for David's finished-WP19C approval without merge, production deployment or WP19D.

## Implementation delivery

Branch: `agent/r6.5-wp19b-world-boundaries-navigation`, based on main `250f0855`.
Draft PR: https://github.com/tametheboardgame/unicorn-valley/pull/162.

## Codex execution

Runtime implementation: `0f980b6`. Exact qualified head: `15be0d3`. CI `34349746804` passed 184 browser cases with 3 configured skips and no failures/unrun; compatibility passed 48 with 15 configured skips; Validate passed 116 files / 441 tests and 481.00 KiB. Immutable preview: `https://9502b39e.unicorn-valley.pages.dev`. Candidate smoke `34348947787` passed against `https://5b6e9886.unicorn-valley.pages.dev`. The conversation disposition is `keep` through David’s gate.
