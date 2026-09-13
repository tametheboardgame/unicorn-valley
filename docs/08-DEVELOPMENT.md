# Unicorn Valley - Development and Validation

## Purpose

This file is the working agreement for human and agent-led implementation runs. The repository is the source of truth: a fresh development conversation should be able to inspect the active work package, discover the canonical architecture and continue without relying on earlier chat history.

Read `docs/architecture/ENGINEERING-STANDARDS.md` before introducing or materially changing scenes, UI, overlays, navigation, interaction/dialogue, audio or test infrastructure.

## Supported development baseline

- Node.js 22 is the CI reference runtime.
- npm is the package manager.
- Vite builds and serves the browser game.
- TypeScript runs in strict mode.
- Biome owns formatting and linting.
- Vitest owns unit tests.
- Playwright owns browser qualification.
- GitHub Actions owns deterministic tier selection and the required quality gate.

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
npm run architecture:validate
npm run verification:policy:test
npm run performance:policy:test
npm run test
npm run test:watch
npm run build
npm run perf:budget
npm run smoke:static
npm run validate
npm run test:play
npm run test:browser-compat
```

`npm run validate` is the local static/unit/build definition of done. Browser qualification is selected separately by CI according to changed-file ownership and escalation rules.

## Formatting and linting policy

Biome configuration in `biome.json` is authoritative.

- Use two-space indentation.
- Use single quotes in JavaScript and TypeScript.
- Keep semicolons enabled.
- Keep trailing commas where the formatter permits them.
- Do not hand-format around Biome; run `npm run format` and commit the formatter output.
- Do not suppress lint rules merely to make CI green. Fix the underlying code unless there is a documented architectural reason for an exception.

Generated output, dependencies, local environment files and coverage output must not be committed.

## Architecture path

The implemented standards are in `docs/architecture/ENGINEERING-STANDARDS.md`. The most important canonical files are:

- `src/game/scenes/SceneCompositionContract.ts`;
- `src/game/scenes/SceneManifest.ts`;
- `src/game/scenes/SceneLifecycleScope.ts`;
- `src/game/ui/UiDesignSystem.ts`;
- `src/game/ui/UiPrimitives.ts`;
- `src/game/ui/CanvasDomOverlayBridge.ts`;
- `src/game/interaction/**` and `src/game/dialogue/**`;
- `src/content/audioBindings.ts` and `src/game/audio/**`;
- `scripts/verification/verificationOwnership.mjs`;
- `scripts/performance/performancePolicy.mjs`.

Do not introduce competing registries, token systems, overlay geometry, dialogue stacks or verification rules when these paths already own the concern.

## Tests

- Unit tests use Vitest and normally live next to the code using `*.test.ts`.
- Browser tests live under `tests/play/**`.
- Keep tests deterministic and network-independent where practical.
- Prefer testing domain/state logic without starting Phaser when a system can be isolated.
- Test semantic/user-visible contracts, not historical coordinates or implementation order.
- A reproducible bug fix should include a regression test when practical.
- Changes to saves/navigation/scene identity must preserve compatibility coverage.
- Touch/mobile behaviour is a first-class validation surface.

`scripts/verification/verificationOwnership.mjs` maps runtime areas to unit/browser groups. New runtime areas must be mapped or CI will deliberately fail safe to full qualification.

## Performance and loading

Production builds emit a Vite manifest. `npm run perf:budget` uses it to enforce the loading architecture rather than a single total-bundle number.

Current hard guards cover entry size, first-playable static graph, largest lazy chunk, JavaScript chunk count, diagnostics isolation and material duplicate chunks. Total JavaScript remains a trend metric.

When adding optional scenes/features:

- use the `SceneManifest` load boundary;
- avoid bootstrap registration unless necessary;
- keep rejected lazy imports retryable;
- preserve `vite:preloadError` stale-chunk recovery;
- preserve no-cache HTML and immutable hashed assets.

## Type safety

TypeScript strict mode is part of the quality gate.

- Avoid `any` unless an external API makes it genuinely unavoidable.
- Prefer explicit domain types at system boundaries.
- Do not bypass compiler errors with broad casts merely to satisfy a work package.

## Branch and work-package discipline

- Implement one roadmap work package per branch unless an explicit dependency requires a stacked branch.
- Use branch names beginning `agent/` for agent-led work.
- Keep unrelated refactors out of a work-package branch.
- Leave the branch buildable and validated.
- Update repository documentation when a work package changes architecture, conventions or project status.
- Open work as a draft pull request until its acceptance criteria and CI checks are satisfied.
- Do not merge or deploy across a declared human gate without explicit acceptance.

## Continuous integration

`.github/workflows/ci.yml` uses the verification planner rather than a fixed all-or-nothing sequence.

- Tier 0: static quality, architecture and policy checks.
- Tier 1: selected/full unit contracts.
- Tier 2: mapped targeted Chromium browser smoke.
- Tier 3: authoritative full Chromium suite in three shards.
- Tier 4: Chromium/Firefox/WebKit compatibility.
- Build/performance: manifest build, static smoke and loading budgets.

Cross-cutting paths such as app bootstrap, persistence, scene architecture and CI/test infrastructure escalate to full qualification. Unmapped runtime/test paths also escalate rather than reducing coverage.

For release qualification, `.github/workflows/deployment-smoke.yml` verifies startup, save, reload and Continue against the exact immutable Cloudflare Pages preview candidate SHA. This is not authority to deploy production.

## Agent completion checklist

Before reporting a work package complete:

1. Re-read the active work package acceptance criteria.
2. Confirm the changes remain in scope and use the canonical engineering paths.
3. Run the required local/static checks.
4. Confirm final branch-head CI and required browser tiers pass.
5. Confirm performance/build checks pass when relevant.
6. Run the immutable-preview smoke if the package requires release qualification.
7. Update `STATUS.md`, `PROJECT_STATE.json` and package evidence at the meaningful checkpoint.
8. Record known limitations and any retirement/deprecation items that remain.
9. Honour the package's human gate before merge/deployment/dependent work.

## Quality-gate ownership

Later work packages may strengthen these rules, but should not silently remove a gate. Any toolchain replacement must preserve equivalent or stronger deterministic validation and update the canonical standards/ownership maps in the same change.
