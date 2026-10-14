# Project Status

Last updated: 2026-10-14

## Integrated main and engineering owner

- Authoritative integrated `main` is **`7fc457c78dc4e3e3d0b3aa695860e5ffc40dcb32`**, merged from the ENG-WP3.2 close-out [PR #315](https://github.com/tametheboardgame/unicorn-valley/pull/315). Its full pre-merge [CI #38538955816](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38538955816) passed the Merge Gate, six Chromium shards and all required checks.
- ENG-WP3.1 and WP3.2 have merged; WP3.2 [PR #314](https://github.com/tametheboardgame/unicorn-valley/pull/314) was merged as `748d797b4c6298dd923cb410686a50898f14d663`, with [CI #38526137461](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38526137461) green. The duration-aware WP3.2 proposals for 6/8/10/12 shards are observational.
- **ENG-WP3.3 remains `in_progress`.** Its owning [draft PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316) is a reviewed **safe foundation checkpoint**, not completed adaptive-count activation. The main branch **still uses the original static-six Playwright runner**. Product/gameplay/test assertions and production deployment are unchanged.

## ENG-WP3.3 verified foundation

- The source/head/run-bound current discovery and healthy-history planner provides exact-cover whole-file proposals for 6/8/10/12, conservatively includes new/unknown files, and **cannot authorise non-six activation**. On PR #316 only, the six-manifest canary executed every assignment with independent per-shard result verification.
- Manifest-six [CI #38547129599](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38547129599) **passed** all six Chromium shards, seven compatibility profiles, smoke, unit/build and Merge Gate. WP3.1 independent reconciliation: **311 discovered = 311 recorded; 308 passed, 3 genuine skips, no unexpected/flaky results**.
- Rollback proof [PR #317](https://github.com/tametheboardgame/unicorn-valley/pull/317) is **closed without merging**. Its correctly main-targeted [CI #38559848055](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38559848055) **passed on retry**: actual selector `static6, jobs=6`, six of six original Playwright shards, seven browser profiles, 311/311 independent reconciliation, and required exact-head Merge Gate. A first-attempt 45-second WebKit-tablet `page.evaluate()` timeout cleared without weakening a test or increasing timeouts.
- A review found and corrected a dependency issue in the proposed static-six selector: it must still emit static-six if observational discovery/history is unavailable. The manifest-six canary instead fails closed without its independent discovery evidence. **The correction is pending new CI qualification on the latest PR #316 head.**

## Performance decision

Observed time to workflow completion: manifest-six **14m48s** in one full green run; static-six **17m33s, 19m42s and 21m30s** in three prior full green runs. Longest Chromium job: manifest-six ~**12.7m** vs static-six ~**15.5–17.8m**. Summed Chromium job elapsed: manifest-six ~**69.1 runner-minutes** vs static-six ~**61.7–71.9** (rough occupancy proxy, **not billed cost**). One canary run and non-contemporaneous comparators are insufficient to prove repeatable end-to-end or runner-cost benefit.

**Decision:** Additional real, comparable end-to-end measurements **are required before changing the main default to manifest-six or enabling 8/10/12 shards**. No count activation is approved. Preserve static-six main behaviour through the integration of the foundation and plan the remaining WP3.3 activation as a subsequent independently qualified step in the same roadmap.

## Integration and next action

- Commit reconciled `AGENTS.md`, `PROJECT_STATE.json`, `STATUS.md`, `TESTING.md` and WP3.3/parent records with final reviewed `TEST_IMPACT_V1` on PR #316. Mark that PR Ready for review only after code review and documented boundaries are complete; run **new full exact-head Tier 0/1/build/whole-game/Tier 3/Tier 4/Merge Gate** before any merge decision.
- Root state is the integrated main summary, not a per-product-PR branch pointer; record the eventual **actual** PR #316 merge SHA and CI on the mandatory next integration checkpoint. Do not invent a future merge SHA or mark WP3.3 complete on a foundation-only PR.
- The strict [Protect Main ruleset](https://github.com/tametheboardgame/unicorn-valley/rules/24999228) remains active; [ENG-WP2.5E #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) is still open, pending separately confirmed stale-otherwise-green rejection. Existing unowned-browser ownership debt (82 historic) remains visible.
- World, Just Games and Story House maintain separate stream state/PRs. No production deployment is authorised.
