---
id: ENG-WP3
title: Adaptive Test Execution and Qualification Architecture
status: in_progress
autonomy: green
depends_on: [ENG-WP2]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
---

# ENG-WP3 — Adaptive Test Architecture

Tracking: [#303](https://github.com/tametheboardgame/unicorn-valley/issues/303).
Prerequisite policy: [ENG-WP2](ENG-WP2-TEST-CONTRACT-LIFECYCLE.md), [#301](https://github.com/tametheboardgame/unicorn-valley/issues/301).

## Goal and architectural division

Create an **adaptive, automatically rebalanced full-suite CI**, driven by the current test inventory and observed durations, with fewer wasted runners and a short critical path. Retain fast ownership-selected draft PR checks. ENG-WP3 answers **how the required tests execute**; ENG-WP2 answers **which behaviours/tests are required and whether a feature change was reviewed**.

Do **not** create a second competing ownership map, automatic test-retirement authority or weaker merge gate.

## Two-speed delivery requirement inherited from ENG-WP2

ENG-WP3 optimises **final qualification execution**, not the draft preview feedback loop. Keep previews available promptly after minimal safe build/smoke; provisional draft test-impact assessments are allowed to be incomplete. Only after functional/visual approval, code/documentation reconciliation and a complete actual-diff contract review should the final full-suite adaptive planner and exact-head Merge Gate be mandatory. Never introduce dynamic scheduling or test-inventory reconciliation as a new full-suite bottleneck for every small visual edit. Truly high-risk current changes retain existing fail-safe escalation.


## Grounded baseline (11 October 2026)

| Observation | Three-shard reference | Six-shard accepted baseline |
| --- | ---: | ---: |
| Chromium slowest job | 29.9 minutes | 14.36 minutes |
| Combined Chromium job elapsed | ~70.8 minutes | 65.82 minutes |
| Selected tests | 307 | 307 |
| Passed / skipped | 304 / 3 | 304 / 3 |
| Cross-browser | ~10.4 minutes | Fully qualified separately |

Source three-shard green [run #38160902089](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38160902089) and six-shard [run #38163775839](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38163775839), followed by exact-head authoritative six-shard green [run #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951). Six-shard [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302) merged as `e9985075d9aebd129eebfe5550b2ace90d13d50a`; isolated six-shard implementation commit `940d0c34cdb6f74273cc72a920206846db8c86ce`.

First six-shard run had 108 test files; observed longest file ~5.15 minutes of test execution (Chess Academy). An **idealised** greedy per-file bin packing of those observed durations estimates a maximum test workload of ~10.1 min at 6 shards, ~7.6 min at 8, and ~5.15 min at 12, **before** runner setup and queueing. It is a planning model, not a measured 8/12-shard run or a guarantee. `fullyParallel: false` keeps a single spec indivisible.

The end-to-end CI bottleneck may become cross-browser or smoke; always benchmark **time until Merge Gate**, not only Tier 3.

## Runtime architecture

```
Changed code + WP2 reviewed impact + ownership metadata
             |
       Existing verification planner
             |
       +-----+-------------------------+
       |                               |
    Draft PR                       Ready for Review
selected units/Chromium         exact-head complete inventory
       |                               |
       |                     Duration history (successful clean runs)
       |                               |
       |                     Adaptive allocation plan / manifest
       |                               |
       |                     Dynamic bounded GitHub job matrix
       |                               |
       +-----------------------> Required verification results
                                       |
                               Manifest integrity + Merge Gate
                                       |
                                 Suite health / duration archive
```

### Core rules

1. **Discovery precedes allocation.** Enumerate the full set of test identities from Playwright's supported discovery, including explicit skips, on the **same source revision and configuration** as the jobs. Record a versioned SHA-bound manifest and immutable partition description. Unknown tests are included by default; never filter them away because they lack runtime history.
2. **One test file per assignment, one assignment per test.** Initially allocate at file granularity (keep `workers: 1`, `fullyParallel: false`). Validate that assigned files constitute an exact partition of the discovered file inventory and that Playwright actually reports the expected individual test identities, statuses and known skips. Avoid a false-green on matching counts alone.
3. **Predictable bounded matrix.** Produce a dynamic GitHub Actions `fromJSON` matrix from a planning job. Initial 6–12 shards, tune only from observed queue/setup/runtime performance, with maximum concurrency respecting repository limits. Do not create empty shards.
4. **Duration-aware assignment.** Use rolling healthy per-file runtimes (e.g. median of last 5–10 successful comparable runs) and longest-first bin packing; new/unmeasured files receive conservative defaults. Persist history outside the checked-in source tree or in stable generated evidence; do not commit timing churn into gameplay PRs. Reproducible deterministic ties.
5. **No hidden fallback.** If metrics are missing, use a conservative default profile; if manifest generation, completeness or evidence validation fails, fail closed or explicitly run the known **complete** static six-shard suite. A partial selection never counts as success.
6. **Preserve authority.** All planned shards must succeed as a single required aggregate Tier 3 job. The exact-head Merge Gate checks inventory reconciliation, Tier 0/unit/build/smoke/Tier 3/Tier 4 results and live PR SHA. Any fail, cancel, skipped required shard, missing results or stale head blocks merge. Preserve an explicit count/identity exception record for intentionally skipped tests.
7. **No weakened tests.** No automatic retries hiding failures, automatic test deletion, unexplained quarantine, new blanket skips, changed test assertions or production behaviour to make scheduling faster.
8. **Cost and quality visibility.** Measure total workflow wall time, queue delay, runner setup cost, max/min shard, combined runner-job minutes, coverage identity, flake/skip history and failures. WP2 owns lifecycle/health policy; WP3 owns execution telemetry.

## Bounded delivery plan

### ENG-WP3.1 — Observability and inventory (no scheduling change)

Create stable machine-readable Playwright reports and a SHA-bound test inventory, with per-file duration history, skips and run-identity evidence. Test bad/missing test identity handling. Reconcile with WP2.1/2.4 ownership and health reports. **Keep current six static shards.**

Exit: report covers every existing Chromium test file and status; no new browser workload or change to Merge Gate pass criteria without independent qualification.

### ENG-WP3.2 — Duration-aware scheduler in shadow mode

Use successful-history durations to generate a deterministic proposed allocation for 6/8/10/12 shards and record predicted critical paths. Compare shadow plan with actual static-six shards for multiple representative runs. Do not change CI execution yet.

Exit: deterministic unit tests for additions, removals, renamed files, new/unknown slow files, skewed workloads, source SHA mismatch and cancelled/incomplete history. Measurable useful improvement vs naive Playwright assignment.

### ENG-WP3.3 — Activate bounded adaptive Tier 3

Introduce a dynamic CI plan generating `fromJSON` matrix data and per-shard test manifests, with independently qualified integration. Start with **6–12 shards**, choose count by predicted completion time, setup overhead, runner-minutes and expected contention. Do not assume 12 or 24 is inherently better; collect actual timings.

Exit: at least one complete green full authoritative run, all tests reconciled exactly once, six-shard comparison and negative tests proving omission/duplicate/unassigned/expired quarantine and stale SHA fail. One isolated implementation commit so it can be reverted to static six-shard execution without reverting WP2 metadata or analytics.

### ENG-WP3.4 — Cross-browser critical path (optional)

Benchmark the seven desktop/tablet/mobile Chromium/Firefox/WebKit configurations; trial a bounded 2–3-job split **without reducing profiles or assertions** if Tier 4 is the gate bottleneck. Retain single aggregated required Tier 4 success and exact-head final protection.

Exit: real workflow wall-time improvement, same coverage, no extra significant runner burden.

### ENG-WP3.5 — Continuous optimisation and handover

Document historical duration window, review thresholds, fallback behaviour, periodic balancing audit, archived evidence retention, peak runner usage, regression/flake alerts and ownership for ongoing maintenance. Demonstrate how a new spec automatically enters inventory and is assigned without hand-editing CI YAML.

Exit: stable runbook, measurable multi-run performance and cost evidence, separate reversibility tested.

## Dependencies, acceptance and reversibility

- **Sequence:** ENG-WP2.1 and WP2.2 foundational review/integrity -> ENG-WP3.1 instrumentation -> WP2.3/2.4 lifecycle health integration -> ENG-WP3.2 shadow plan -> ENG-WP3.3 activation -> ENG-WP3.4 optional compatibility -> ENG-WP3.5 closeout. WP2/3 may share planning and data contracts but code delivery stays in bounded, independently qualified PRs.
- **Architecture contract:** WP2 registry/test-impact policy produces the authoritative requirements; WP3 must never independently decide tests are retired/unnecessary. ENG-WP3.1 can provide data to WP2.4, with one owning policy and the other raw evidence.
- **Measured success:** total time to authoritative Merge Gate improves on representative runs, expected coverage identities and skip statuses match, and combined runner-minutes/queue overhead are acceptable. Do not accept an improvement measured solely at individual Chromium job level.
- **Fallback:** static-six CI on `main` is the proven starting point. Planning, instrumentation and scheduler activation are independently revertible. On rollback to six, keep WP2 impact-assessment enforcement and contract health metadata intact. No `main` force-push or production deployment.

## Decisions pending implementation

- Preferred duration source: Playwright machine report artifacts + run ID and git SHA; verify on installed Playwright 1.55.0 before committing CLI syntax.
- Whether an external durable history store is necessary or a small versioned rolling artifact snapshot suffices.
- Default predicted duration for newly added specs and policies for clean-run outliers.
- Whether seven compatibility profiles should be partitioned before or after Chromium scheduling matures.

## Completion

**WP3.1 complete (12 October 2026).** PR #309 merged as `118669255e42890092a7ad1ac2862ecfc2aaecd3` after all required checks and independent 311/311 six-shard identity reconciliation passed in CI #38269906778. This adds observational SHA-bound discovery/result/duration artifacts, not a new scheduler or Merge Gate dependency. WP3.2 completed and merged on 14 October 2026 in PR #314 (merge `748d797b4c6298dd923cb410686a50898f14d663`, full CI #38526137461). Shadow-only allocations for 6/8/10/12 shards are available, with one comparable historical run and no proven wall-clock saving yet. WP3.3 activation is the next separately bounded package; optional WP3.4 and WP3.5 remain proposed. Static-six remains the accepted execution configuration.
