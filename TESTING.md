# Testing and Validation

This is the operator-level validation contract. `docs/08-DEVELOPMENT.md`, `docs/architecture/ENGINEERING-STANDARDS.md`, package-specific acceptance and CI remain authoritative for implementation detail.

## Environment

- Node.js 22 is the CI reference runtime.
- npm is the package manager.
- Use `npm ci` for clean automated runs.

## Standard local validation

```sh
npm run validate
```

`npm run validate` covers the local static/unit/build gate:

- audio catalogue check;
- formatting and linting;
- architecture-boundary checks;
- verification-policy tests;
- performance-policy tests;
- TypeScript type-check;
- Vitest unit tests;
- production Vite build with manifest;
- performance architecture budget;
- static-output smoke test.

Browser tests are intentionally separate because CI selects their scope from changed-file ownership.

Before each source/content push, run:

```sh
npm run format
npm run format:check
```

CI's Tier 0 checks continue through lint, architecture, policy and conditional type-check even if Biome formatting fails, then consolidate the failures into one job. Review the uploaded `formatter-remediation` patch rather than making speculative follow-up edits.

## Focused commands

```sh
npm run architecture:validate
npm run verification:policy:test
npm run performance:policy:test
npm run test
npm run build
npm run perf:budget
npm run smoke:static
npm run test:play
npm run test:browser-compat
```

The deterministic selectors also expose:

```sh
npm run test:unit:selected
npm run test:browser:selected
```

These selected runners are normally driven by CI environment values produced by `scripts/verification/planVerification.mjs`, not hand-curated guesses.

## Development feedback versus final qualification

The project deliberately separates **fast development feedback** from **authoritative section/release qualification**.

### Provisional draft preview versus finalisation

For an unfinished visual or content package, a preview URL is the primary feedback loop. After a viable build and minimal required smoke, publish it promptly; do not hold feedback behind full Chromium/cross-browser checks or a completed impact assessment. Keep the PR in **draft**, with a short provisional scope/risk/test-impact note. Iterate freely within scope. Risky current deltas and known broken gameplay still require proportionate or escalated safety checks.

**After the final visual/functional baseline is approved**, do code/architecture cleanup and documentation reconciliation, then complete a comprehensive test-contract review against the actual final diff. Add, update or explicitly replace tests and ownership, or justify existing unchanged coverage. Complete this work **before** the Ready-for-review transition that triggers the authoritative full CI on that exact head.

WP2.2 must validate the two stages differently: incomplete **provisional drafts are allowed**, while incomplete **final-stage/non-draft** reviews fail. This rule must have automated positive and negative policy tests. A preview is not a merge or deployment approval.

### During active development

Use the cheapest checks that protect the current change and make the preview credible.

- Tier 0 always protects formatting/lint/architecture/policy.
- Ownership-selected unit tests and targeted Chromium contracts run for the subsystems actually changed.
- Build/static smoke and performance run when runtime output or loading-sensitive code requires them.
- Documentation-only changes do not run browser matrices.
- Ordinary UI/content iterations do not automatically run all Chromium shards plus Firefox/WebKit.
- Shared-system changes use representative targeted regression tests unless the **current delta** hits a documented high-risk escalation path.

For pull-request updates, CI uses the incremental `synchronize` delta since the previous PR head when available. The fallback is the cumulative PR diff. This avoids a long-lived branch repeatedly paying for an earlier high-risk change after each later minor correction.

### At the finalised merge boundary

After code, documentation and full test-impact finalisation, and before merging an approved substantive slice to `main`, mark the draft PR **Ready for review**. This triggers **authoritative full qualification on that exact head**. A subsequent push while non-draft automatically invalidates the previous result and runs full qualification again. Manual full-CI dispatch remains a supported fallback; provide its optional PR number when using it to qualify a PR, so the Merge Gate checks the live head rather than treating it as an unbound release run. The full gate includes:

- full unit qualification;
- production build/static smoke/performance;
- all full Chromium shards;
- Chromium/Firefox/WebKit compatibility;
- any package-specific final/deployment smoke.

Do not merge until the **Merge Gate** is green for the current live PR head. It verifies required job results, including all Chromium shards and compatibility profiles, and re-reads the latest head from GitHub to reject stale qualification. A green draft-PR focused check is provisional, never the final merge authority. A later full run on `main` is post-merge confirmation, not initial qualification.

## Verification tiers

`.github/workflows/ci.yml` uses the ownership/policy model under `scripts/verification/**`.

- Tier 0: formatting, linting, architecture rules, verification-policy tests, performance-policy tests, conditional type-check and durable project-contract validation.
- Tier 1: full or ownership-selected unit contracts.
- Tier 2: targeted Chromium browser smoke for mapped feature changes.
- Tier 3: full Chromium playtest suite, sharded 1/6 through 6/6 (six parallel GitHub Actions jobs, one required aggregate Tier 3 result).
- Tier 4: Chromium/Firefox/WebKit compatibility matrix.
- Build/performance: production manifest build, static smoke and player-visible performance budgets.

Small mapped draft changes use focused tiers. A high-risk current delta or unmapped runtime/test path can still fail safe to full qualification, but a previous high-risk change elsewhere in the same long-lived PR must not make every later tiny edit repeat Tier 3/4. PR concurrency cancels superseded heads; main and manual full runs are not cancelled by PR updates. Ready-for-review heads and subsequent non-draft updates must run full qualification and pass the exact-head Merge Gate.

The ownership map is `scripts/verification/verificationOwnership.mjs`. Update that map when adding a genuinely new subsystem or test ownership path.

## Performance validation

`scripts/performance/performancePolicy.mjs` distinguishes startup cost from total game breadth.

Hard guards currently cover:

- entry raw size;
- initial/title/first-playable gzip graph;
- largest lazy JavaScript chunk;
- JavaScript chunk count;
- diagnostics accidentally entering startup;
- material duplicate JavaScript payloads.

Total emitted JavaScript remains visible as a trend metric. Do not weaken the player-visible budgets or convert optional breadth back into a single arbitrary startup proxy merely to make CI green.

## Browser and deployment validation

```sh
npm run test:play
npm run test:browser-compat
```

For final release qualification, `.github/workflows/deployment-smoke.yml` exercises the exact immutable Cloudflare Pages preview candidate through startup, save, reload and Continue. A production deployment is separate and requires explicit authorisation.

## Test principles

- Keep tests deterministic and network-independent where practical.
- Prefer domain/state tests without Phaser when behaviour can be isolated.
- Assert semantic/user-visible contracts rather than historical coordinates or implementation order.
- Add regression coverage for reproducible bugs where reasonable.
- Preserve save compatibility and migration coverage when persistence changes.
- Treat touch/mobile behaviour as a first-class validation surface.
- Prefer stable semantic selectors/diagnostics contracts in Playwright tests.
- Await an observable ready state or frame/progression evidence instead of using fixed wall-clock waits for asynchronous game actions; never lower gameplay thresholds merely to silence a slow CI renderer.
- When a browser contract asserts a retired scene, coordinate, object or control, identify its current canonical owner and migrate coverage before removing the obsolete assertion.
- Do not suppress lint/type/test failures merely to make CI green.

## Package completion

Every bounded work package must name its validation requirements. Code existence is not technical completion.

Before calling a package technically complete:

- required local/static checks have passed;
- the final branch-head CI state is known;
- all package-required browser tiers have passed;
- performance/build checks have passed where applicable;
- any immutable-preview smoke required by the package has passed;
- known limitations are recorded.

Human visual/child-UX acceptance is a separate gate where declared by the package.


## Mini-game platform contracts

Mini-game platform changes under `src/game/minigames/**` select the shared mini-game verification owner.

- `tests/play/mg-wp4-mini-game-launch-return-contract.spec.ts` is the reusable Just Games family launch/ready/return contract. New catalogue families extend its declarative case table instead of copying the full browser flow.
- `src/game/minigames/MiniGameSandboxContract.testSupport.ts` provides the reusable sandbox/world adventure-effect assertions for unit fixtures.
- Game-specific rules and representative world-entry tests remain required where behaviour changes; the shared contracts do not replace them.
- Final human-approved substantive heads still require the repository's authoritative exact-head Tier 0-4 qualification before merge.

## Contract inventory (ENG-WP2.1)

Run `node scripts/verification/contractInventory.mjs --output=contract-inventory.json` to create a machine-readable inventory of current unit/browser spec files, owner groups, smoke/compatibility membership, lifecycle declarations and actionable errors. Existing `npm run verification:policy:test` covers inventory integrity and negative cases.

The report derives ownership from `scripts/verification/verificationOwnership.mjs`. It does **not** select tests, replace the verification planner or reduce coverage. Frozen unowned browser specs are listed in `scripts/verification/contractInventoryBaseline.json` as explicit historical review debt; they still run in the authoritative full suite. Do not add new specs to that list as a shortcut: add a genuine source-to-test ownership mapping instead. When replacing, moving or retiring a mapped test, reconcile its ownership/lifecycle references and the baseline in the same change. Expired quarantine, missing replacement and missing config references are integrity errors. WP2.2 will add mandatory work-package test-impact reviews later.


## Progressive Test Impact Assessment (WP2.2)

New PRs from #307 onwards use the TEST_IMPACT_V1 JSON block in the PR description. A draft PR may leave this provisional; an incomplete final review is a **warning, not a preview blocker** in draft. A Ready-for-review PR must set stage reviewed, reconcile declared areas with the entire changed-file list, identify every modified spec/unit test, reference existing test contracts, document tests updated/replaced/retired or unchanged with a reason, and record risk, evidence, review and any human gate. CI retrieves the full PR changed-file list from the GitHub API and fails closed on incomplete results.

New work-package files declare test_impact_stage and test_impact_scope in YAML front matter; stage reviewed is required in a new WP by final qualification. Historic completed WP files and older open PRs are not retroactively subject to the new contract. The policy runs as a Tier 0 check and does **not** change which unit/Chromium/cross-browser tests run or reduce Merge Gate authority. An edited PR description starts a fresh CI run.

## Observable browser fixture — WP2.3A

Use waitForReadySceneSnapshot(page, sceneKey, readyObjectName) from tests/support/browserDiagnostics.ts when asserting a scene's objects after player-visible readiness. Unlike separate scene/object waits and a later snapshot, it returns the **same diagnostic scene** which simultaneously showed the scene active and the required ready marker visible. Keep separate real gameplay, interaction, scene-exit and non-interactivity assertions; the fixture must never make an absent marker count as a pass.

For Just Games launch/return, include a real visible readiness marker when available (for example the Pond Leap frog or Chess Academy teacher). For sequential interactive clicks, wait for the real first-action feedback before sending the second. Fail under Playwright's existing bounded waits when the required state does not appear. Do not use broad retries, sleep loops, global timeout increases or skips.


### ENG-WP2.3A: intentional invisible scene anchors

The environment-production manager creates an invisible zone named `environment-production:<area>:anchor` with `setVisible(false)`. This is structural metadata, **not** a missing rendered scene. Pass `'present'` as the fourth argument to `waitForReadySceneSnapshot` only for such deliberately non-visible markers; default `'visible'` remains mandatory for player-facing Pond Leap frogs, Chess teacher objects and interactive controls. Preserve the existing layer/non-interactivity assertions after capturing the same ready scene snapshot.

Environment checks are now one Playwright test per region (Glade, Village, Brook, Woods, Rainbow Run), with separate boot/context and failure localisation. Do not increase the 45-second global limit or hide failed assertions. This replaces one five-region composite, retaining all five regions and original layer assertions.


### ENG-WP2.3A: Escape transition across resumed mini-game menus

The Just Games menu and the Chess Academy both subscribe to Escape. The Academy's Escape stops its scene and resumes Just Games; under full parallel Chromium load a single keydown reached both handlers, leaving the player on Title instead of Just Games. `JustGamesScene` now records the monotonic resumption time and ignores any Escape event that originated before that scene resumed. A subsequent fresh Escape still navigates to Title, and mouse-driven Back to Home is unchanged. The existing MG-WP4 launch/return contract now explicitly verifies **first Escape → Just Games, second fresh Escape → Title** for Chess Academy. No timeouts, sleeps, retries or assertion reductions have been introduced.

### ENG-WP2.3A — short-lived Rainbow Disc defence readiness

`tests/play/r6.5-wp19h4.9-rainbow-disc.spec.ts` now observes the actually rendered defence route **and** the player-actionable state in one `page.waitForFunction` call. Do not first await the cue and then start a second watch after it may have expired. The diagnostic `defenceCueRenderedLane` is the route the player actually saw, not the hidden attack target. A correct/wrong lane is still selected through the real mouse and the subsequent game-state assertions still run. Missing actionable state is a failure with a current diagnostic snapshot, not a skip or automatic retry.


### ENG-WP2.3A — settings accessibility browser journey

The canonical Settings persistence test still visits the real Settings screen, toggles Reduced Motion via a real pointer action, asserts local storage, leaves via Escape, reloads and verifies persisted UI. The previous helper issued eight or more ArrowDown keypresses and full Phaser snapshots per visit; under six concurrent Chromium jobs this made an otherwise fully passing 45-second journey run out of time during clean-up. Its scoped helper now performs genuine mouse-wheel scrolling inside the Settings viewport in bounded 520-unit steps (338 logical-pixel scroll, less than the 420-pixel view), stopping only when the same target is visibly interactive. It retains every persistence and display assertion and does not change the global timeout or real game input handling. Other keyboard-specific tests remain separate. Trace from CI #38238393181 confirms the former journey reached its final assertion; this change removes unnecessary unrelated row traversal without assuming success.


### ENG-WP2.3A — fixed Settings navigation and physical Story House collision proof

The settings-test wheel optimisation failed because Playwright's wheel events did not reliably scroll the Phaser scene: CI screenshot remained at the top after all wheel attempts. The corrected test sends the game's supported real ArrowDown input in *pairs*, requiring the same named control to be visible and interactive after each pair. It avoids full Phaser snapshots after every single keypress. All persistence, reload, settings and accessibility assertions remain intact.

The Story House counter-collision regression previously assumed the player sprite's centre Y must always be at least 674, independent of actual Phaser physics body scaling. The new assertion verifies the character moved towards the desk and, crucially, its actual Arcade `bodyY` has not passed into the counter's physical `bodyY + bodyHeight` boundary, allowing only one logical pixel for contact rounding. The counter identity and 300×112 dimensions remain checked separately. This validates **physical blocking**, not a potentially stale render-origin constant, and is stronger than asserting a world-space centre coordinate by itself.


### ENG-WP2.3A — whole-game smoke: multi-scene integration budgets

The Marigold/Nova picnic regression intentionally exercises a complete player journey: dialogue before/after saving Maple's cake quest, genuine village and meadow bootstraps, persistent picnic relocation, both characters' conversations, and a final return to verify that the departed NPC no longer offers ghost interaction. It has remained **one integration contract** because the save-state journey is the subject of the test. CI run `38245167553` passed every substantive assertion, including its final one, but finished at 48.2 seconds against Playwright's default 45-second test-wide budget under simultaneous browser shards. This specific regression now declares `test.setTimeout(90_000)`, consistent with other full cross-scene contracts; this is a **per-test total execution budget**, not a per-step assertion or global timeout. Do not extend the global timeout or suppress assertions. If this test fails inside 90 seconds, investigate the actual step/scene and attached trace rather than making another blanket time change. All six Chromium shards and compatibility passed on the run identifying this isolated whole-game smoke failure.

## ENG-WP3.1 — machine-readable Chromium qualification evidence

When a full six-shard Chromium run is selected, the current CI now archives a `chromium-test-discovery` artifact from `npx playwright test --list --reporter=json`, plus `test-evidence.json` alongside each of the six existing `tier3-chromium-N-of-6` artifacts. A separate `chromium-evidence-reconciliation` artifact compares every discovered stable test identity to exactly one execution-or-skip identity, rejects duplicate/missing/unknown tests and SHA/run/shard mismatches, and ranks the slowest spec files by measured durations. This evidence feeds ENG-WP2.4 health policy and ENG-WP3.2 shadow balancing but does not yet control the shard scheduler or alter the exact-head Merge Gate.

**Crucial distinction:** Playwright's `--list` JSON output marks all listed cases `skipped` because none executes. The normalised discovery manifest reports them as `discovered`. Only actual per-shard execution JSON supplies real `expected`, `unexpected`, `flaky` and `skipped` outcomes. The complete [CI #38267022053](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38267022053) proved 311/311 identities reconciled across 6/6 shards, with 308 expected and 3 actual skips. The observed source checkout is a GitHub PR merge SHA, recorded separately from the candidate PR head; both are bound to the run ID. Missing observational evidence is a finding, not permission to reduce game tests.

## ENG-WP2.4 suite-health evidence

The full-suite CI's existing **WP3.1 evidence reconciliation** job also emits a read-only `suite-health` artifact (`suite-health.json` and `suite-health.md`). It combines actual six-shard Playwright outcomes and the WP2.1 contract inventory. It shows test ownership, unowned historical debt, genuine skips, slow specs, lifecycle status and review age. A slow file in one run is **not** labelled flaky; repeated failures require multiple independently identified, complete historical runs.

The corresponding Node tests run within `npm run verification:policy:test` (Tier 0). The report itself is currently observational and **does not** change required shards, browser assertions, draft preview speed or the Merge Gate. For local analysis after downloading the normalised reconciliation and six shard artifacts:

```sh
node scripts/verification/suiteHealth.mjs --reconciliation=reconciliation-report.json --shards=shard-evidence --output=suite-health.json --markdown=suite-health.md
```

Use the JSON for all per-file evidence and warning codes; Markdown shows the leading issues. For local/offline analysis, historical reports can be supplied as a validated JSON array via `--history=history.json`. In normal CI, a separate observational step automatically attempts to retrieve qualifying historical reports from retained `main` artifacts; if no such records exist, the report explicitly uses single-run mode rather than inventing trends. Contract ownership or quarantine changes must be made in WP2.1 metadata, never by making the health reporter silently omit tests.

## ENG-WP2.4 routine suite-health review and historical evidence

The existing scheduled full CI job runs weekly on Sunday. When six-shard reports are available, it now attempts to retrieve **up to five** independent health reports from recently completed `main` GitHub Actions runs. A failed workflow can still provide a valid complete health report; cancelled, partial, mismatched and expired reports never count as evidence. Full reports and provenance are included in the `suite-health` artifact; retrieval metadata distinguishes `history-loaded`, `no-eligible-history` and `history-unavailable`. Artifact retention is 14 days, so this is a bounded recent history, not perpetual storage.

Engineering verification maintains the weekly review, monthly ownership-backlog review and quarterly contract-lifecycle review. Mapped source-area owners fix tests with their affected work packages. Do not grandfather newly unowned browser contracts, inflate timeouts, delete tests or call a single slow observation repeated flakiness. Longstanding unowned browser entries still execute and are warning-level debt.

Warnings include 180-second cumulative slow spec duration; two comparable prior complete runs plus both a 30% and 30-second increase for a duration trend; two independent runs with unexpected/flaky status for recurring failures; actual runtime skips; changed inventoried files since the latest eligible `main` evidence; and review age beyond 180 days. For a final PR, the **WP2.2 actual-diff test-impact check remains blocking**, including any added/modified tests not listed in `contracts[]` and any deletion without replacement. New node tests for history selection, SHA/run integrity, and changed test-impact contracts are part of Tier 0.

Neither historical availability nor the report's warning count is a new Merge Gate criterion. Evidence integrity is protected in report generation, while the six static Chromium shards and existing authoritative merge checks remain unchanged.

## ENG-WP2.5 parallel-stream validation

Tier 0 validates the four independent JSON status records in `docs/streams/state/` and runs stream-ownership and merge-freshness regression tests. During final PR review, the changed-file policy blocks new product PRs from editing global root project state or another stream's record; provisional drafts remain fast. The CI concurrency group already keys on PR number, so updating one draft does not cancel another.

The exact-head Merge Gate now also queries current `main`, compares it with the **live** PR head and verifies that latest main is the merge base (zero behind). A stale but previously green PR must integrate current main and rerun its full CI before merging. API errors fail closed. GitHub strict protected branch/merge queue settings must still be configured by a repository administrator to close the remaining merge-time race.

## ENG-WP2.5D — Live conflict visibility and Story catalogue merge-order regression

The `parallelIntegrationPolicy.test.mjs` tests exercise three simultaneous independent World/Just Games/Story PR models, unique current-head deployment URL provenance, changed-file overlap detection, and unresolved collision rejection. The final-only `checkStreamOwnership.mjs` also enumerates other open `main` PRs and their paginated changed-file lists, so overlapping source is discovered from live repository state rather than an old static registry. Pre-rollout PRs remain allowed provisional feedback but must manually reconcile before finalisation.

`parallelStoryGenerator.test.mjs` uses the **real** Story catalogue generator in two independent temporary source trees with reversed book-introduction order. It verifies byte-for-byte deterministic output, all independently published titles retained and successful `--check` validation. These tests do not merge real unapproved content PRs or prove independent live browser accessibility. See ENG-WP2.5D evidence for observed Cloudflare branch-deployment comments and shared-file collision matrix.

For full platform safety, repository administrator must complete [ENG-WP2.5E #313](https://github.com/tametheboardgame/unicorn-valley/issues/313): required strict up-to-date `Merge Gate` or merge queue with no routine direct-push bypass. An in-repo check is not equivalent to a protected branch rule.
