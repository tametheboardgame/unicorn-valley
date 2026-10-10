# Project Status

Last updated: 2026-10-10

## Current work

The active package is **ENG-WP1 - CI and Development Process Hardening**.

Current checkpoint: **ENG-WP1.4 - Modernise stale browser contracts**

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

The first ENG-WP1.4 family and the NPC production-identity checks are green. The second family's full browser run exposed an inactive Race Hub diagnostic transition and the genuine missing Marigold/Nova Picnic Hill Talk registrations. Both have been repaired on the branch and await targeted browser qualification before advancing to contextual feedback.

## Operating reminders

- One bounded checkpoint at a time.
- Run focused checks during remediation, not the full Chromium matrix after every edit.
- Inspect all available failure evidence before making a correction.
- Do not change accepted production behaviour to satisfy an obsolete test.
- Run formatting before pushing changed source/content.
- Reconnect GitHub immediately after an access failure.
- Do not sit in repeated CI/deployment polling loops.
