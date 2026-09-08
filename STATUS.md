# Project Status

Last updated: 2026-09-08

## Current work

`R6.5-WP19A - Persistence and truthful success feedback`

Path: `docs/work-packages/R6.5-WP19A-PERSISTENCE-SAFETY.md`

State: **WP19A dispatched but blocked: Codex reports no cloud environment for this repo**. The full plan is approved in draft PR #159. This branch begins the first approved implementation package; no gameplay fix is complete yet.

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
- Storage fault tests reproduce an uncaught read failure and false Bakery purchase success after a rejected save.
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

## Human feedback and gates

Original evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

Current ledger: `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md`.

No new daughter replay occurred. Preserve all positive feedback and deferred ideas. WP18H remains the physical Galaxy Tab S8 replay; WP17 requires David's explicit readiness decision. R7 remains blocked.

## Delivery

Documentation-only branch: `agent/r6.5-whole-game-audit-plan`. David explicitly authorised the documentation branch push and draft PR on 2026-09-08, resolving the earlier automatic-review block. Published through the connected GitHub app after shell Git authentication was unavailable: https://github.com/tametheboardgame/unicorn-valley/pull/159. Draft PR remains open; no merge has occurred. No merge or production deployment is authorised by completion of this audit. Production was previously updated by the approved WP18I/J merge; this proposal does not change the game.

## Next action

WP19A implementation is authorised and being handed to Codex through its dedicated draft PR. Follow `docs/CODEX-DELIVERY-WORKFLOW.md`. Next after verified WP19A: WP18K. All six plan decisions are approved; future visual and replay gates remain.

Chat disposition: `keep`.

## Implementation delivery

Branch: `agent/r6.5-wp19a-persistence-safety`, stacked on the approved planning branch while PR #159 remains unmerged. Keep gameplay changes off PR #159. The project manager reviews results and reports the verified preview URL to David before required human gates.

## Codex setup blocker

Implementation PR: https://github.com/tametheboardgame/unicorn-valley/pull/160. Dispatch: issuecomment-5584158968. Codex replied in issuecomment-5584160637 that an environment must be created at https://chatgpt.com/codex/cloud/settings/environments. No worker implementation has started. David must create/select a Codex cloud environment for this repo, then confirm so the existing task can be retried once. The hourly delivery-manager automation is enabled; do not repeat task launches while this blocker remains.
