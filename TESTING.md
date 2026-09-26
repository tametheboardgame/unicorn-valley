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

Before merging an approved substantive slice to `main`, run one **authoritative full qualification on the exact approved head** using the manual full-CI dispatch. That is the point for:

- full unit qualification;
- production build/static smoke/performance;
- all full Chromium shards;
- Chromium/Firefox/WebKit compatibility;
- any package-specific final/deployment smoke.

Do not merge the section to production until this exact-head full gate is green. A later full run on `main` is post-merge confirmation rather than the first time the whole game is qualified.

## Verification tiers

`.github/workflows/ci.yml` uses the ownership/policy model under `scripts/verification/**`.

- Tier 0: formatting, linting, architecture rules, verification-policy tests, performance-policy tests, conditional type-check and durable project-contract validation.
- Tier 1: full or ownership-selected unit contracts.
- Tier 2: targeted Chromium browser smoke for mapped feature changes.
- Tier 3: full Chromium playtest suite, sharded 1/3, 2/3 and 3/3.
- Tier 4: Chromium/Firefox/WebKit compatibility matrix.
- Build/performance: production manifest build, static smoke and player-visible performance budgets.

Small mapped changes use focused tiers. A high-risk current delta or unmapped runtime/test path can still fail safe to full qualification, but a previous high-risk change elsewhere in the same long-lived PR must not make every later tiny edit repeat Tier 3/4. Final human-approved section heads always receive one explicit authoritative full qualification before merge.

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
