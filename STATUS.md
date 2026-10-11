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

ENG-WP1.1–WP1.3 are complete. Four current contracts were reproduced, a genuine Just Games race Escape defect was corrected, and fourteen obsolete browser contracts were retired with replacement coverage retained.

ENG-WP1.4 has nine qualified modernisation families plus the Crystal Grotto family. Mobile racing passed 33/33 selected tests (CI `38125054158`); Race Hub 3/3 (`38125477510`); H6.3 Meadow/Brook traversal 1/1 (`38126714606`); H6.4 rock perimeter 2/2 (`38126837711`); Story House illustration switching 5/5 (`38127180622`); Nova visual evidence 5/5 (`38127429300`); Grotto/discovery 6/6 (`38128027531`); and the corrected MG-WP4 Just Games return contract 7/7 (`38131620384`). Maple baking and beachcombing passed all three targeted tests in `38132074158`.

The last remaining H4.9 Rainbow Disc full-match regression has reached 5/6 passing (`38133450956`). The trace showed the first catch's delayed readiness transition had not completed while the test repeatedly serialised full Phaser scene snapshots. A lighter read-only timingActive probe is implemented on `20354916cd072a54117cdfe1d6af01522ebed4a1`, preserving the visible-control and two-goal assertions. First CI `38134662137` was stopped at Tier 0 by one Biome line-wrap error, now corrected. **Rainbow Disc is not yet qualified**.

ENG-WP1.5 harness fixes, WP1.6 nine-test whole-game smoke, WP1.7 Tier 0 aggregation, WP1.8 superseded-PR cancellation/profile validation, WP1.9 exact-head Merge Gate and WP1.10 repository rule reconciliation are implemented. The current smoke suite passed 9/9 and Tier 4 compatibility passed 49/49 in CI `38130437400`, but the authoritative full baseline remained red on historical Chromium cases.

PR #299 is **draft and unmerged**. Final authoritative full Chromium qualification and a green exact-head Merge Gate remain required. GitHub reports `main` as **unprotected**; repository administration must require the Merge Gate for automatic merge enforcement.

## Next work

1. Obtain a green focused Rainbow Disc run with the lightweight timing probe and corrected formatting.
2. Keep the roadmap and project state aligned with actual check outcomes.
3. Move PR #299 to Ready for Review and let the exact-head authoritative run complete once.
4. Verify all required checks, address actual remaining failures if any, then merge and verify main. No deployment or feature-work restart before qualification.

## Operating reminders

- One bounded checkpoint at a time.
- Run focused checks during remediation, not the full Chromium matrix after every edit.
- Inspect all available failure evidence before making a correction.
- Do not change accepted production behaviour to satisfy an obsolete test.
- Run formatting before pushing changed source/content.
- Reconnect GitHub immediately after an access failure.
- Do not sit in repeated CI/deployment polling loops.

## ENG-WP1 CI machinery checkpoint (2026-10-11)

- Focused checks are bounded and PR concurrency cancels superseded commits. Tier 0 now reports formatter, lint, architecture and policy failures together, with a remediation artifact.
- The exact-head Merge Gate refuses a stale SHA, red selected tests or incomplete authoritative unit/build/smoke/Chromium/compatibility qualification. Draft checks are provisional.
- ENG-WP1.6 smoke passed 9/9 and Tier 4 compatibility passed 49/49 in CI `38130437400`. The full Chromium rerun is awaiting a completely green Rainbow Disc family.
- The first read-only Rainbow Disc diagnostic run stopped on a single Biome formatting difference; the correction and explicit authoritative build-policy check are in the current checkpoint.
- Protect `main` and require Merge Gate at GitHub repository-settings level after the full qualification; in-repository checks alone are advisory while the branch is unprotected.

## ENG-WP1 five-contract Chromium repair checkpoint (2026-10-11)

- Authoritative CI `38148791260` on `7f50adf6` passed verification planning, Tier 0, unit, build, whole-game smoke and compatibility, but failed shard 1 (Pond Leap return and sparkle-weather mode selection) and shard 3 (Rainbow Disc target-range and two defence cue contracts); shard 2 was cancelled and the Merge Gate correctly failed.
- Pending validation: Pond Leap Escape propagation is contained to the active scene; the weather test verifies each player-facing mode before advancing; Rainbow Disc defence diagnostics retain the lane of the cue actually rendered for the current turn; practice target-range avoids duplicate scene snapshots and has a bounded evidence-based 75-second end-to-end budget.
- PR #299 is back in draft for focused qualification. Do not claim these repairs passed, move the PR to Ready for Review, merge, or resume ENG-WP2 until targeted verification and subsequent exact-head full qualification succeed.
