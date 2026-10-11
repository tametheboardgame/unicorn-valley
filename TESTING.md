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

### During active development

Use the cheapest checks that protect the current change and make the preview credible.

- Tier 0 always protects formatting/lint/architecture/policy.
- Ownership-selected unit tests and targeted Chromium contracts run for the subsystems actually changed.
- Build/static smoke and performance run when runtime output or loading-sensitive code requires them.
- Documentation-only changes do not run browser matrices.
- Ordinary UI/content iterations do not automatically run all Chromium shards plus Firefox/WebKit.
- Shared-system changes use representative targeted regression tests unless the **current delta** hits a documented high-risk escalation path.

For pull-request updates, CI uses the incremental `synchronize` delta since the previous PR head when available. The fallback is the cumulative PR diff. This avoids a long-lived branch repeatedly paying for an earlier high-risk change after each later minor correction.

### At a human-approved section boundary

Before merging an approved substantive slice to `main`, mark the draft PR **Ready for review**. This triggers **authoritative full qualification on that exact head**. A subsequent push while non-draft automatically invalidates the previous result and runs full qualification again. Manual full-CI dispatch remains a supported fallback. The full gate includes:

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
- Tier 3: full Chromium playtest suite, sharded 1/3, 2/3 and 3/3.
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
