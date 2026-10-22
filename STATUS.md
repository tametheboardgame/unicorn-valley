# Project Status

Last updated: 2026-10-22

## Crystal Brook H6.5A integrated and next World stage

- [World PR #328](https://github.com/tametheboardgame/unicorn-valley/pull/328) **merged** with verified `main` integration SHA `b374aea19ae03a98a303d4a5ee0f972b0616ee57`. The human-approved area visuals, faceted crystal colliders, Grotto/Reflection Pool, feeder confluence and stepping-stone crossing are in `main`. Exact PR-head [CI #39755450820](https://github.com/tametheboardgame/unicorn-valley/actions/runs/39755450820) passed Tier 0, unit, build, smoke, all six Chromium shards, seven cross-browser profiles and Merge Gate. This is repository integration verification, **not** a claim of separate production release.
- **Next World slice:** `R6.5-WP19H6.7` environment, residents and interaction remediation. The World stream is unclaimed between PRs; no H6.7 implementation is started by this documentation checkpoint.
- **Racing deferral:** H6.6 and Rainbow Run H5 hub polish are explicitly moved with MG-WP11 to one consolidated Racing Programme after **all** exploration areas are accepted; current working race hub entry/return remains supported. See the top-level `ROADMAP.md` for future RACE-WP0–WP5 boundaries.
- **Parallel safety:** Story House SH2.0 and Just Games MG-WP7 remain separate PRs. This checkpoint has no game source changes or other product stream edits.

## Archived previous engineering checkpoint

Last checkpoint: 2026-10-15

## Integrated main and ENG-WP3 close-out

- Last verified integrated `main` is **`cb4e3e6b3cff8e79640c53037232c7b9bba7aa20`**, the actual merge SHA from [ENG-WP3 close-out PR #321](https://github.com/tametheboardgame/unicorn-valley/pull/321). Its exact-head [CI #38702524201](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38702524201) passed on attempt 1: Tier 0, unit, build, smoke, original six Chromium shards, all seven browser-compatibility profiles, independent coverage and Merge Gate. Before that, root checkpoint [PR #318](https://github.com/tametheboardgame/unicorn-valley/pull/318) merged as `6074a8ed3238ccaf29d412be9bb592838d509aac`, after the qualified foundation [PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316).
- **ENG-WP3.3 and parent ENG-WP3 are complete as evaluated, with non-six activation deliberately declined.** WP3.1 independent telemetry and WP3.2 observational six/eight/ten/twelve planning remain available. The actual authoritative `main` uses the **original static-six Chromium Playwright runner**, full compatibility profiles and exact-head Merge Gate. No gameplay test assertions or product code are changed.
- Experimental [PR #319](https://github.com/tametheboardgame/unicorn-valley/pull/319) passed fresh full eight-shard [CI #38609186912](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38609186912): 8/8 Chromium, independent reconciliation of **311/311** identities (308 passed, three genuine skips), full seven-profile Tier 4 and Merge Gate. It **closed unmerged**, retaining only a small independently tested fail-closed status/summary integrity improvement via this engineering close-out PR.
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

The ENG-WP3 close-out [PR #321](https://github.com/tametheboardgame/unicorn-valley/pull/321) has merged with all protected checks green. This documentation-only checkpoint reconciles its real integration SHA; then engineering ownership hands back to independent product streams. Independent World, Just Games and Story House work continues under stream-local state/PR ownership. No production deployment is authorised.
