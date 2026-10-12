---
id: ENG-WP2.4
title: Test Suite Health and Contract Review Policy
status: in_progress
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP3.1]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Implementation PR #311 under provisional review until exact-head CI qualification
---

# ENG-WP2.4 — Test Suite Health and Contract Review Policy

Tracking: [ENG-WP2 #301](https://github.com/tametheboardgame/unicorn-valley/issues/301). Based on the completed [ENG-WP3.1 evidence package](ENG-WP3.1-TEST-INSTRUMENTATION.md). **Implementation in draft PR #311.** Health reporting is observational; no new Merge Gate dependency or shard selection rule.

## Goal

Expose ageing, unowned, slow and repeatedly failing tests early enough for their owning workstreams to maintain them during ordinary finalisation, without silently skipping them or impeding rapid provisional preview iterations.

## Proposed bounded scope

1. Consume the WP2.1 `contractInventory.mjs` inventory and WP3.1 run-scoped identity/duration/skip reports. WP2 owns policy and disposition; WP3 remains owner of execution instrumentation and future scheduling.
2. Report currently unmapped specs by path; contracts needing lifecycle review; explicit skips, quarantines/expiry, replacements, changed test inventory and last-known health. No automatic retirements.
3. Produce a machine-readable and human-readable report with per-spec observations and clear source/run provenance. Separate confirmed multi-run patterns from a single slow run. Never infer flakiness from one passing run.
4. Define owner, review cadence and warning/blocking rules. Only established integrity violations should fail closed; historical debt remains visible, not retroactively forbidden.
5. Demonstrate positive and negative policy tests: missing owner for a new test, vanished file references, expired quarantine, unreviewed test-change diff and honest owner disposition.
6. Measure baseline before/after report coverage and describe hand-off to WP3.2's shadow scheduler, without dynamically changing shards or Merge Gate authority.

## Non-goals

No gameplay changes, arbitrary timeout increases, blanket retries, test deletions, automatic quarantine, scheduling matrix changes or production deployment. Keep current six-shard exact-head qualification and fast draft previews.

## Test Impact Assessment

PR #310 only introduced the proposal. PR #311 implements the first reporting and validation checkpoint. Its test-impact assessment remains provisional pending final review. Existing browser gameplay contracts and test selectors remain unchanged.

## Implementation checkpoint

Started 12 October 2026 on a dedicated branch from the qualified WP3.1 close-out. Phase A: source-bound health reporting, inventory evidence correlation, explicit status and duration warnings, integrity checks, and Node policy tests. Phase B: CI artifact integration and actual-diff review, without new merge requirements or shard changes. Latest draft CI found formatting, suite-health test fixture and project-state errors; the test fixture and state have been corrected. No passing full authoritative run or merge yet.

## Implemented checkpoint (draft)

- `scripts/verification/suiteHealth.mjs` consumes WP2.1 contract inventory and complete source/run-bound WP3.1 six-shard results; produces JSON and Markdown health evidence.
- Reports legacy unowned tests as debt, genuine skips, slow spec observations, missing review/expired quarantine provenance through inventory, unobserved specs, and repeated failures only after distinct historical run evidence.
- `scripts/verification/suiteHealth.test.mjs` covers positive/negative policy cases; included in Tier 0 via the existing verification policy test entrypoint.
- CI generates an observational `suite-health` artifact with both formats after WP3.1 reconciliation. It does not add any Merge Gate dependency, change static six-shard selection or modify browser assertions.
- The optional `--history=history.json` argument expects previously validated health report objects; CI currently supplies only its current run and must not claim historical flakiness without actual archived records. Future history ingestion and retention needs operational qualification.

## Health policy

Hard contract integrity failures are inherited from WP2.1 and fail Tier 0: new unowned browser specs, missing ownership/file/replacement references, invalid or expired quarantines. Newly added suite-health Node tests fail Tier 0 if invalid evidence is accepted. Single-run slow/skip/age findings and frozen legacy unowned specs remain warning-level. Missing or inconsistent reporting prevents a valid health report; during the introduction stage, the report step is observational and does not alter the existing authoritative Merge Gate.


## Baseline diagnosis — first trusted full run

[CI #38279756359](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38279756359) completed successfully on 12 October 2026 at PR head `95b503f375481b7ceecd091aa5e1709daaaf3d4d`. Independent discovery and execution reconciled 311 of 311 cases: 308 expected, three **actual runtime** skips, no unexpected or flaky cases, no missing identities. WP2.4 reported 110/110 browser specs observed, 166 unit specs inventoried, zero hard errors and 107 warnings.

The **82 historical unowned browser specs** are frozen in `scripts/verification/contractInventoryBaseline.json` and all executed; they are not 82 failed, quarantined or skipped specs. Their records remain a visible backlog. Newly unowned browser specs remain blocked by WP2.1. The 107 warnings also contain unit ownership and per-run health observations; detailed counts belong to the generated `summary.warningCounts`, not an inferred number of failing tests.

Three highest cumulative-duration browser spec files in that run:

| File | Sum of Playwright attempt durations | Disposition |
| --- | ---: | --- |
| `tests/play/mg-wp5-chess-academy.spec.ts` | 300,986 ms | Review fixtures / repeated setup during normal Just Games maintenance; do not relax assertions |
| `tests/play/r6.5-wp18b-freeze-stability.spec.ts` | 280,223 ms | Engineering reliability review; preserve the actual freeze/regression behaviour |
| `tests/play/r6.5-wp19h4.9-rainbow-disc.spec.ts` | 214,435 ms | Review during Rainbow Disc ownership work; do not increase global timeouts |

These are totals of multiple tests/attempts within a file, not individual test timeouts. The three runtime skips need an owner to confirm whether they are intentional; they are never counted as missing identities or assumed healthy simply because CI passed. The baseline has **no prior trusted suite-health runs**, so it proves neither repeated flakiness nor improvement/deterioration.

## Periodic review and responsibility

The **owner of the code/source workstream** identified through `verificationOwnership.mjs` is responsible for reviewing a spec's behavioural value, references, real input and user-visible assertions when a work package affects it. A brand-new browser contract must have an explicit `BROWSER_GROUPS` mapping; final test-impact review must cover every changed test. No invented individual assignees or duplicate registry is introduced.

- **Unowned historical browser contracts (82):** engineering verification maintainer keeps the central backlog; source-area maintainer assumes responsibility when that spec is mapped. Review the inventory **monthly** and reconcile opportunistically with feature work. Prioritise main-world, Just Games and Story House specs that are about to be edited. Do not add new specs to the historical exception list.
- **Unit ownership warnings:** source-area workstream reviews missing mappings when related code changes, with engineering verification maintaining the overall queue. Unit ownership is a warning until the existing WP2.1 rules explicitly tighten it.
- **Skipped execution cases:** engineering verification maintainer triages each reported runtime skip at the **next weekly health review**, asks the relevant area owner to justify or repair it, and records any intentional skip rationale/expiry alongside its contract. A discovery-only `skipped` marker is never treated as a genuine runtime skip.
- **Slow specimens:** a single cumulative spec duration of **180,000 ms or more** warns. With at least two independent historical readings for the **same test count**, a `>=30%` increase **and** at least **30,000 ms** absolute increase raises `SLOWING_SPEC_TREND`. Owning workstream reviews fixtures, assertions and duplicated setup within the next ordinary package; engineering owns cross-cutting test infrastructure. No automatic timeout increase or scheduler repartition.
- **Repeated failures:** two independently identified complete runs with unexpected/flaky outcomes for the same spec are required. A single current run is not enough. Escalate to the behavioural owner and diagnose; never blanket quarantine.
- **Lifecycle age:** an explicitly reviewed contract older than **180 days** warns. Reaffirm meaningful intent/replacement on next affecting PR or the **quarterly contract review**; absent review metadata is retained as visible inventory debt, not fabricated review evidence.
- **Blocking:** genuinely new unmapped browser contracts; missing file/owner/config/replacement references; invalid or expired quarantines; and incomplete final WP2.2 review fail their **existing Tier 0 checks**. A missing or corrupt historical artifact is disclosed as `history-unavailable` or an excluded candidate, not promoted to a new hard merge blocker. Invalid **current** evidence cannot be reported as valid, while report upload remains observational.
- **Governance cadence:** the pre-existing weekly Sunday CI schedule performs authoritative full qualification, including health artifact generation. The engineering maintainer checks its warning categories and source/run IDs weekly, reviews the debt backlog monthly, and performs a source-to-test lifecycle sweep quarterly. GitHub artifact retention is **14 days**, so trends are bounded to available history, not a permanent data warehouse.

## Historic comparison implementation

`scripts/verification/fetchSuiteHealthHistory.mjs` queries GitHub Actions for completed `main` runs and tries at most **12** recent eligible run candidates, retaining up to **five** source-verified reports. It considers both successful and failed CI runs, but only accepts an artifact reporting `valid: true`, zero integrity errors, matching run ID, matching source/head SHA, nonnegative counters and unique paths. This makes repeat failures from complete failed executions observable without inventing evidence from aborted or partial runs.

Archive retrieval is limited to 2 MiB, uses a fixed `suite-health.json` entry and cleans up temporary storage. Reports without retained artifacts, misbound SHAs or incomplete records are excluded with reasons. `suite-health-history-metadata.json` records collection status, accepted IDs and exclusions. `suite-health.json` records whether comparisons were single-run or historical and includes per-code warning counts, additions/removals since the most recent available `main` inventory, repeated failures and duration trends. **On the first merge, or when history is unavailable, the honest result is zero history samples; later eligible main runs build the trend.** The 14-day retention prevents promises of a permanent longitudinal history.

Comparisons are warnings, not test-selection authority or automatic deletion. WP3.2 may consume real duration trends in shadow mode; static six shards and existing exact-head Merge Gate are unchanged.

## Demonstration of test-impact integrity

`testImpactPolicy.test.mjs` exercises a genuine feature-area contract path (`tests/play/mg-wp7-new-mode-contract.spec.ts`) within a simulated complete PR diff. Omitting the newly added contract from `TEST_IMPACT_V1.contracts` fails final review; naming both changed contracts passes. This is a **policy fixture**, not a new browser test or Pond Leap gameplay change. Existing negative tests still enforce removed-contract replacement and missing WP front matter. Provisional draft feedback remains permissive; final non-draft reviews remain fail-closed.

## Validation and hand-off

The initial qualified baseline (before history wiring) is the green run above. The additional history fetching, comparisons, policy test and cadence documentation are a **new unqualified commit** until CI completes on their exact head. PR #311 stays draft. The final check must inspect the generated history metadata, the health JSON's warning categories and the actual cumulative diff, then complete the PR's final impact assessment before marking Ready-for-review. No production deployment.
