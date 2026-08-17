# Unicorn Valley - Development and Validation

## Purpose

This file is the working agreement for human and agent-led implementation runs. The repository is the source of truth: a new development conversation should be able to inspect the current work package, follow these commands and continue without relying on earlier chat history.

## Supported development baseline

- Node.js 22 is the CI reference runtime.
- npm is the package manager.
- Vite builds and serves the browser game.
- TypeScript runs in strict mode.
- Biome owns formatting and linting.
- Vitest owns unit tests.
- GitHub Actions runs the required quality gate.

The `package.json` engine remains compatible with Node.js versions supported by the current Vite toolchain, but new automated work should target the Node.js version used by CI unless a work package intentionally changes it.

## First-time setup

From the repository root:

```sh
npm install
npm run validate
```

Do not begin feature work while the baseline validation command is failing for an unrelated reason.

## Standard commands

```sh
npm run dev
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run build
npm run validate
```

`npm run validate` is the local definition of done for code changes. It checks formatting, linting, TypeScript, tests and the production build.

## Formatting and linting policy

Biome configuration in `biome.json` is authoritative.

- Use two-space indentation.
- Use single quotes in JavaScript and TypeScript.
- Keep semicolons enabled.
- Keep trailing commas where the formatter permits them.
- Keep lines at or below the configured formatter target where practical.
- Do not suppress lint rules merely to make CI green. Fix the underlying code unless there is a documented architectural reason for an exception.
- Run `npm run format` before final validation when files have been edited substantially.

Generated output, dependencies, local environment files and coverage output must not be committed.

## Tests

- Unit tests use Vitest.
- Keep focused unit tests next to the code they exercise using `*.test.ts` naming.
- Tests must be deterministic and must not depend on network access.
- Prefer testing domain/state logic without starting Phaser when a system can be tested independently.
- Gameplay work packages should add tests for durable rules and state transitions where practical.
- A bug fix should include a regression test when the behaviour can be isolated reasonably.

## Type safety

TypeScript strict mode is part of the quality gate.

- Avoid `any` unless an external API makes it genuinely unavoidable.
- Prefer explicit domain types at system boundaries.
- Do not bypass compiler errors with broad casts merely to satisfy a work package.
- Intentionally broken TypeScript must fail `npm run typecheck` and therefore fail `npm run validate` and CI.

## Branch and work-package discipline

- Implement one roadmap work package per branch unless an explicit dependency requires a stacked branch.
- Use branch names beginning `agent/` for agent-led work.
- Keep unrelated refactors out of a work-package branch.
- Leave the branch buildable and validated.
- Update repository documentation when a work package changes architecture, conventions or project status.
- Open work as a draft pull request until its acceptance criteria and CI checks are satisfied.

When a package depends on an unmerged package, branch from the dependency and target the dependency branch with the stacked pull request. Retarget to `main` after the dependency is merged.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests. The validation job performs:

1. repository checkout;
2. Node.js setup;
3. dependency installation;
4. formatting check;
5. linting;
6. TypeScript type-checking;
7. unit tests;
8. production Vite build.

A work package is not complete while this workflow is failing because of its changes.

## Agent completion checklist

Before reporting a work package complete:

1. Re-read the work package acceptance criteria in `docs/07-WORK-PACKAGES.md`.
2. Check that changes remain inside the intended package scope.
3. Run or otherwise exercise the repository validation gate.
4. Confirm unit tests pass.
5. Confirm the production build passes.
6. Confirm CI passes on the final branch head.
7. Update the README project status and identify the next work package when appropriate.
8. Summarise what changed, the validation performed and any known limitation in the pull request description.

## Quality-gate ownership

R0-WP0.3 establishes these rules. Later work packages may strengthen them, but should not silently remove a gate. If a future toolchain change replaces Biome, Vitest, TypeScript or the CI structure, the replacement must preserve equivalent or stronger automated validation.
