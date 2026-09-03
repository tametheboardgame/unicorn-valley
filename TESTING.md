# Testing and Validation

This is the concise operating-level validation contract. `docs/08-DEVELOPMENT.md`, package-specific tests and CI configuration remain authoritative for implementation detail.

## Environment

- Node.js 22 is the CI reference runtime.
- npm is the package manager.
- Install with `npm ci` for clean automated runs or `npm install` for normal first-time local setup.

## Standard local validation

```sh
npm run validate
```

`npm run validate` covers:

- format check;
- lint;
- TypeScript type-check;
- Vitest unit tests;
- production build;
- performance budget;
- static-output smoke test.

## Browser validation

```sh
npm run test:play
npm run test:browser-compat
```

CI runs the automated browser playtest and browser compatibility matrix after the main validation job passes.

## Test principles

- Keep tests deterministic and network-independent where practical.
- Prefer domain/state tests without Phaser where the behaviour can be isolated.
- Add regression coverage for reproducible bugs where reasonable.
- Preserve save compatibility and migration coverage when persistence changes.
- Treat touch/mobile behaviour as a first-class validation surface.
- Do not suppress lint/type errors merely to make CI green.

## Package completion

Every bounded work package must name the exact checks required for its scope. At minimum, code-changing packages require the project CI gate unless the package documents a justified exception.

A package is not technically complete while CI fails because of its changes.

## Human validation

Visual quality, child comprehension, touch feel and play preference cannot always be reduced to automated checks. When a bounded package declares a human gate, technical success is recorded separately and dependent work must respect that gate.

## CI

`.github/workflows/ci.yml` is the application quality gate and currently runs:

1. formatting;
2. lint;
3. type-check;
4. unit tests;
5. production build;
6. performance budget;
7. static smoke test;
8. automated browser playtest;
9. Chromium/Firefox/WebKit compatibility checks.

The separate `Validate AI Project Contract` workflow validates the durable operating spine rather than game correctness.
