# Project Status

Last updated: 2026-10-15

## Integrated main and ENG-WP3 close-out

- Authoritative `main` *before this close-out PR* is `6074a8ed3238ccaf29d412be9bb592838d509aac`, from [PR #318](https://github.com/tametheboardgame/unicorn-valley/pull/318) (merged post-foundation state). Safe reviewed six-manifest instrumentation foundation [PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316) merged as `2aa705128c66deda21751ec853aba0f867c7991e`. Reconcile **actual post-close-out merge SHA** in a following integration checkpoint; do not fabricate it.
- **ENG-WP3.3 and parent ENG-WP3 are closing as evaluated/completed, but non-six activation is deliberately declined.** WP3.1 independent telemetry and WP3.2 observational six/eight/ten/twelve planning remain available. The actual authoritative `main` uses the **original static-six Chromium Playwright runner**, full compatibility profiles and exact-head Merge Gate. No gameplay test assertions or product code are changed.
- Experimental [PR #319](https://github.com/tametheboardgame/unicorn-valley/pull/319) passed fresh full eight-shard [CI #38609186912](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38609186912): 8/8 Chromium, independent reconciliation of **311/311** identities (308 passed, three genuine skips), full seven-profile Tier 4 and Merge Gate. It will **close unmerged**, retaining only a small independently tested fail-closed status/summary integrity improvement via this engineering close-out PR.
- Optional cross-browser splitting (WP3.4) is deferred. Operational review/maintenance (WP3.5) is adopted in `AGENTS.md`, `TESTING.md` and tracking [issue #320](https://github.com/tametheboardgame/unicorn-valley/issues/320). The independent [ENG-WP2.5E repository-admin protection task #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) remains open.

## Performance decision

| Full green run | End-to-end | Longest Chromium shard | Combined Chromium job elapsed |
| --- | ---: | ---: | ---: |
| Six-manifest [CI #38547129599](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38547129599) | 14m48s | ~12m42s | ~69.1 runner-min |
| Eight-way [CI #38609186912](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38609186912) | 14m20s | ~10m11s | ~76.1 runner-min |

An unpaired **28-second / 3.2% overall** advantage at approximately **10% more Chromium runner-minutes** does not demonstrate enough repeatable benefit to activate 8/10/12. Tier 4 compatibility ran ~12m21s in the clean eight-way qualification, showing the broader workflow critical path. Keep static-six.

## Mandatory proactive test-health review

- Engineering/integration owner performs **monthly monitoring and a written quarterly assessment**, first due **15 January 2027**, tracked by [#320](https://github.com/tametheboardgame/unicorn-valley/issues/320).
- **Earlier review** if test identities reach **374+**, **3/5** clean full runs take **25+ minutes** to Merge Gate, **3/10** qualifying runs need retries (or any repeatable deterministic required-gate failure), or **3/5** green Tier 4 runs take **15+ minutes**.
- Trigger requires bounded investigation and a documented keep/change decision, **not** automatic shard escalation or weakened required checks. New scheduler activation needs independently qualified repeatable performance, runner-cost and rollback evidence.

## Next integration

Finish this close-out PR's policy and exact-head qualification, merge under protection, then reconcile root state to the real merge SHA. Independent World, Just Games and Story House work continues under stream-local state/PR ownership. No production deployment is authorised.
