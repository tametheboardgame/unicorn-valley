# Project Status

Last updated: 2026-10-14

## Integrated main and engineering owner

- Authoritative integrated `main` is **`2aa705128c66deda21751ec853aba0f867c7991e`**, from merged [ENG-WP3.3 foundation PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316) on 14 October 2026. Its final exact-head [CI #38582807916, attempt 2](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38582807916) passed Tier 0, unit/build, smoke, six manifest-six Chromium jobs, seven compatibility profiles and the exact-head Merge Gate. The pre-merge head was `652faffb6ebdf9c9cab7c9083397b81dc037ad92`; integration SHA shown here is the real GitHub merge SHA.
- ENG-WP3.1 and WP3.2 have merged; WP3.2 [PR #314](https://github.com/tametheboardgame/unicorn-valley/pull/314) was merged as `748d797b4c6298dd923cb410686a50898f14d663`, with [CI #38526137461](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38526137461) green. The duration-aware WP3.2 proposals for 6/8/10/12 shards are observational.
- **ENG-WP3.3 remains `in_progress`.** Its [PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316) **merged**, delivering a reviewed safe six-shard foundation, **not** completing adaptive-count activation. The main branch **still uses the original static-six Playwright runner**. Product/gameplay/test assertions and production deployment are unchanged.

## ENG-WP3.3 verified foundation

- The source/head/run-bound current discovery and healthy-history planner provides exact-cover whole-file proposals for 6/8/10/12, conservatively includes new/unknown files, and **cannot authorise non-six activation**. On PR #316 only, the six-manifest canary executed every assignment with independent per-shard result verification.
- Manifest-six [CI #38547129599](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38547129599) **passed** all six Chromium shards, seven compatibility profiles, smoke, unit/build and Merge Gate. WP3.1 independent reconciliation: **311 discovered = 311 recorded; 308 passed, 3 genuine skips, no unexpected/flaky results**.
- Rollback proof [PR #317](https://github.com/tametheboardgame/unicorn-valley/pull/317) is **closed without merging**. Its correctly main-targeted [CI #38559848055](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38559848055) **passed on retry**: actual selector `static6, jobs=6`, six of six original Playwright shards, seven browser profiles, 311/311 independent reconciliation, and required exact-head Merge Gate. A first-attempt 45-second WebKit-tablet `page.evaluate()` timeout cleared without weakening a test or increasing timeouts.
- A review found and corrected a dependency issue in the proposed static-six selector: it must still emit static-six if observational discovery/history is unavailable. The manifest-six canary instead fails closed without its independent discovery evidence. **The correction passed full exact-head CI #38582807916 attempt 2 before PR #316 was merged; main remains static-six.**

## Performance decision

Observed time to workflow completion: manifest-six **14m48s** in one full green run; static-six **17m33s, 19m42s and 21m30s** in three prior full green runs. Longest Chromium job: manifest-six ~**12.7m** vs static-six ~**15.5–17.8m**. Summed Chromium job elapsed: manifest-six ~**69.1 runner-minutes** vs static-six ~**61.7–71.9** (rough occupancy proxy, **not billed cost**). One canary run and non-contemporaneous comparators are insufficient to prove repeatable end-to-end or runner-cost benefit.

**Decision:** Additional real, comparable end-to-end measurements **are required before changing the main default to manifest-six or enabling 8/10/12 shards**. No count activation is approved. Preserve static-six main behaviour through the integration of the foundation and plan the remaining WP3.3 activation as a subsequent independently qualified step in the same roadmap.

## Integration and next action

- **Post-merge checkpoint:** PR #316 merged on 14 October 2026 as `2aa705128c66deda21751ec853aba0f867c7991e`. Its source/head-bound manifest-six qualification [CI #38582807916](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38582807916), attempt 2, passed the authoritative exact-head Merge Gate and WP3.1 **311/311** identity reconciliation: 308 passing, three expected skips, zero flaky/unexpected. The isolated initial shard 3 p95 performance exceedance (123.2ms vs 120ms) passed on bounded retry **without weakening the limit**.
- Mandatory root-state integration reconciliation follows as this documentation-only checkpoint PR. **ENG-WP3.3 remains `in_progress`**; next bounded activation branch must be based on this reconciled main and must not enable non-six on main without independent proof.
- Next: implement versioned 8/10/12 manifests and full source/run-bound evidence, bounded exact-cover global reconciliation and per-count negative tests in a new **draft PR**. Collect repeatable measured full workflow time-to-Merge-Gate and approximate runner-minute cost for each count, with an explicit separate original static-six rollback. Keep all existing acceptance and branch-protection gates.
- `AGENTS.md` was reviewed on this checkpoint and its WP3.2 completion/hand-off contract remains sufficient; **no textual rule change is needed**. Continue preserving the strict [Protect Main ruleset](https://github.com/tametheboardgame/unicorn-valley/rules/24999228). [ENG-WP2.5E #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) remains an independent open item.
- World, Just Games and Story House continue in their own streams, without competing root-state edits. No production deployment is authorised.
