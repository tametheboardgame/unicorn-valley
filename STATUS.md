# Project Status

Last updated: 2026-10-11

## Current work

The active package is **ENG-WP1 - CI and Development Process Hardening**.

Current checkpoint: **ENG-WP1.4 residual contract qualification and ENG-WP1.7–1.10 CI hardening**

Branch: `agent/eng-wp1-ci-process-hardening`

Draft PR: **#299**

Normal feature development is temporarily paused while ENG-WP1 establishes a trustworthy mainline CI and merge baseline.

## Accepted product baseline

- **Story House:** complete through SH1.8. Alice, Peter Rabbit, Jemima Puddle-Duck and The Lantern at the Edge of the Woods are human-approved and merged.
- **Crystal Brook:** H6.0-H6.5 are complete and human-approved. **H6.6 - Crystal Cup Race Hub maturity and access review** is the next world checkpoint after ENG-WP1.
- **Mini-games:** MG-WP0-MG-WP6 are complete. **MG-WP7 - Pond Leap expansion** remains a paused draft stream and must not advance during ENG-WP1.
- **Rainbow Run:** its final area/racing review remains deliberately deferred to the later coherent racing pass.

## CI baseline at ENG-WP1 start

Baseline `main`: `31b9ac22067458990f5833f69137123dc282f7c8`.

Main CI run `38071510363` completed with:

- Verification plan: passed;
- Tier 0 static and architecture: passed;
- Tier 1 unit contracts: passed;
- build/static smoke/performance: passed;
- Tier 4 Chromium/Firefox/WebKit compatibility: passed;
- Tier 3 full Chromium shard 1: failed;
- Tier 3 full Chromium shard 2: failed;
- Tier 3 full Chromium shard 3: failed.

The three Chromium shards contain **47 browser-test failures**. Current evidence shows a mixture of obsolete historical contracts, stale tests, brittle/test-harness defects and a small number of current-contract candidates requiring reproduction. Do not treat the raw count as 47 assumed production regressions.

## ENG-WP1 scope

The package will:

- reproduce the current-contract failure candidates before changing production behaviour;
- retire obsolete browser contracts and modernise useful stale coverage;
- repair brittle timing/test-harness patterns;
- rebuild the distinction between fast development checks and authoritative qualification;
- aggregate cheap deterministic CI feedback where practical;
- cancel superseded PR runs;
- enforce exact-head final qualification and a single merge gate;
- reconcile `AGENTS.md`, `TESTING.md` and `ACCEPTANCE.md` with the implemented process;
- finish with one meaningful green full baseline before feature development resumes.

Detailed package: `docs/work-packages/ENG-WP1-CI-DEVELOPMENT-PROCESS-HARDENING.md`.

## Paused feature streams

Do not begin H6.6 or advance MG-WP7 while ENG-WP1 is active. Existing historical/draft PRs may remain open until the hardening closeout cleanup checkpoint.

## Current hardening result

ENG-WP1.2 is complete: all four focused current contracts are now green, including the repaired Just Games -> Rainbow Run Escape return.

ENG-WP1.3 is complete. The 14 obsolete historical contracts were retired and the surviving replacement-owner slice is green on `4c7ffde8e57d4e40e12a669f4bdc1578063ce0c7`. ENG-WP1.4 is now modernising the 26 useful but stale browser contracts. The known H6.3 harness defect remains sequenced for ENG-WP1.5.

## Next work

Eight ENG-WP1.4 families are qualified: profile/title/home, NPC/picnic, Crystal Brook contextual-feedback and responsive evidence, mobile racing (33/33 on `a5726db43782b7293d02c0f88edb0d35769ce91e`), Race Hub traversal (3/3 on `ae7c897043d6099a479e2476490803992c7dace7`), H6.4 rock perimeter (2/2 on `3b90541a63fe2b46b7688039ef2140d934e23b1c`), Story House illustration switching (5/5 on `85f38ec54e3c92163190b503d1a1c4bc11d4ac66`), and R6.5-WP18F visual evidence for current Nova Race Hub presence (5/5 on `183a8bfa54a78d98dc6a7ce12856cac862231796`). Rainbow Disc match and defender input tests remain unresolved (4/6 on `e9bb17ddd15c089c08c924ff36bcfa6d777e2b5b`); latest real-keyboard repair at `6ba5398e0025d4641b523c87ceea6686bba060ba` awaits CI `38127868904`. R5 optional Brook Grotto discovery test is modernised at `194fc7fde49a99d401787bbdf7c79fc76d5d398f`, with CI `38128027531` pending. The isolated ENG-WP1.5 H6.3 diagnostic scope/startup defect passed 1/1 on `8d7d0ac94819c24bc9cc8338d335661c85660d90`. Full Chromium baseline and merge qualification remain outstanding.

## Operating reminders

- One bounded checkpoint at a time.
- Run focused checks during remediation, not the full Chromium matrix after every edit.
- Inspect all available failure evidence before making a correction.
- Do not change accepted production behaviour to satisfy an obsolete test.
- Run formatting before pushing changed source/content.
- Reconnect GitHub immediately after an access failure.
- Do not sit in repeated CI/deployment polling loops.

## ENG-WP1 CI machinery checkpoint (2026-10-11)

- PR #299 remains **draft**; no merge or deployment is authorised yet.
- `291232e7a84321cfba6388f3477adfe1c3e01662` adds PR concurrency cancellation and Ready-for-Review full-run triggering.
- `e2b5eba9fb5b63eaeec21376fd080a4fba282c1e` aggregates formatter, lint, architecture and policy failures in Tier 0; the formatter still uploads an exact remediation patch.
- `64903d833cc6dd443740717369c32878fcf74c5a` implements an exact-live-PR-head Merge Gate, selected-job enforcement and tests for stale/partial qualification; CI validation is pending.
- Rainbow Disc has read-only lane/match-state diagnostics at `1b399c6d8993e8d323685abca770c3ac7fec0e9a`. The latest test assertions have been formatted at `a5099493129e67eb59bedba4e7972ca8cbde16b0`; browser qualification is still needed.
- The H6 Crystal Grotto branch and revisit contract passed 6/6 on `194fc7fde49a99d401787bbdf7c79fc76d5d398f` (CI `38128027531`).
- Next: finish the Rainbow Disc investigation, qualify the revised Merge Gate and Tier 0 machinery, define the lean whole-game browser owner gate (ENG-WP1.6), then run one exact-head authoritative baseline. Do not merge until it is meaningful and green.
