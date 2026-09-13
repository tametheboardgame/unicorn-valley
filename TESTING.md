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

## Verification tiers

`.github/workflows/ci.yml` uses the ownership/policy model under `scripts/verification/**`.

- Tier 0: formatting, linting, architecture rules, verification-policy tests, performance-policy tests, conditional type-check and durable project-contract validation.
- Tier 1: full or ownership-selected unit contracts.
- Tier 2: targeted Chromium browser smoke for mapped feature changes.
- Tier 3: full Chromium playtest suite, sharded 1/3, 2/3 and 3/3.
- Tier 4: Chromium/Firefox/WebKit compatibility matrix.
- Build/performance: production manifest build, static smoke and player-visible performance budgets.

Small mapped changes can use focused tiers. Cross-cutting or escalation-path changes run full qualification. Unmapped runtime/test files fail safe to full qualification rather than silently skipping coverage.

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
