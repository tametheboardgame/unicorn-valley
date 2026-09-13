# WP19H0 execution tracker

## Authority and delivery

David authorised H0A-H0K in strict order on one long-lived delivery branch. Codex completed bounded H0A only; ChatGPT is continuing directly in GitHub because Codex/Work usage capacity is exhausted.

- Verified starting main: `ba60ede9ba8697f6015bfb3d79e98152a972403d`.
- Delivery branch: `agent/r6.5-wp19h0-consolidation`.
- Umbrella draft PR: #172.
- Canonical contract: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`.

## Phase state

- H0A: complete and accepted.
- H0B: complete and accepted.
- H0C: complete and accepted.
- H0D: complete and accepted.
- H0E: complete and accepted.
- H0F: complete and accepted.
- H0G: active.
- H0H: not started.
- H0I: not started.
- H0J: not started.
- H0K: not started.

## H0A acceptance evidence

H0A established the reproducible architecture/test/bundle/CI baseline without production `src/` or workflow behaviour changes. It recorded 471,915 raw entry bytes, 666,008 total-JavaScript gzip bytes (650.398 KiB) and 81 JS chunks. The inherited 650 KiB total-JS ceiling remained the only CI failure; project-contract and immutable deployment smoke passed.

## H0B acceptance evidence

Canonical architecture contract: `docs/architecture/RUNTIME-ARCHITECTURE.md`.

Representative migration: `ContinueRestoreManager` moved from `src/game/save/` to `src/game/application/` because it coordinates persistence, TitleScene state and lazy destination-scene registration. Its implementation, singleton lifetime, scene keys, save IDs and status wording were preserved.

Executable boundary tooling:

- `scripts/architecture/architectureBoundaries.mjs`;
- `scripts/architecture/architectureBoundaries.test.mjs`;
- `scripts/architecture/checkArchitectureBoundaries.mjs`;
- `npm run architecture:validate` runs in CI.

Initial hard rule: persistence under `src/game/save/` may not import scene, UI/presentation or application-orchestration implementation.

H0B checkpoint `e0b588c49cea3fa7eec748a79892b6f8bbdc1ed1` qualification:

- format and lint pass, with 34 inherited lint warnings;
- four architecture self-tests pass, including synthetic save-to-scene and save-to-application prohibited edges;
- production scan passes across 380 `src/game` files;
- type-check passes;
- 120 Vitest files / 465 tests pass;
- production build passes;
- AI project contract passes;
- immutable deployed startup/save/reload/Continue smoke passes;
- total JS is 650.2 KiB gzip against the unchanged 650 KiB envelope, so CI remains red only at the inherited performance gate. H0B slightly improves the H0A 650.4 KiB baseline and does not raise the budget.

H0B therefore satisfies all acceptance criteria and is closed.

## H0C acceptance evidence

H0C established `UiDesignSystem.ts` as the canonical visual token source, converged existing canvas/CSS consumers onto it, added reusable canvas primitives and introduced `CanvasDomOverlayBridge` as the supported native-control overlay path. Settings audio range/select controls now use the bridge for coordinate conversion, scaling, minimum sizing, containment/visibility, z-order, pointer propagation and lifecycle rather than bespoke canvas-to-DOM maths.

The recurring concept panel/shadow path was migrated to the reusable primitive contract as the canvas-only proof. Accessibility names and native range/select semantics were retained.

Current-head H0C qualification on `0423dc7215506b7c0768f6c9ac73abe75a300b60`:

- format, lint, architecture checks, type-check, unit tests and production build pass before the inherited performance gate;
- 121 Vitest files / 469 tests pass;
- project-contract validation passes;
- immutable startup/save/reload/Continue smoke passes;
- targeted Settings/UI browser regression passes;
- cross-browser compatibility rerun passes with 48 passed / 15 intentional skips across Chromium, Firefox and WebKit desktop/tablet/mobile configurations;
- one prior WebKit-tablet attempt timed out before canvas visibility, then passed in 1.4 seconds on the clean rerun with no code change, so it is recorded for H0E as environmental/flaky evidence rather than hidden or waived;
- total JS remains above the unchanged inherited 650 KiB ceiling at approximately 651.8 KiB gzip. The budget was not raised.

H0C therefore satisfies its UI, DOM-bridge, responsive and accessibility acceptance criteria and is closed.

## H0D acceptance evidence

H0D established a composition-first scene contract without introducing a giant base class. It added a side-effect-free scene manifest for stable identity/loading metadata, a browser constructor registry, typed scene composition declarations, `SceneLifecycleScope` with idempotent owned cleanup, and reusable scene input ownership. `DoorwayStubScene` is the low-risk proof migration and the new-scene recipe documents required identity, load boundary, audio, persistence, spawn/return, shell/HUD, interaction, responsive, teardown and test ownership declarations.

The live `VillageInteriorScene` manifest owner remains `R6VillageInteriorScene.ts`; the older duplicate is preserved for H0J retirement proof rather than deleted opportunistically.

Final H0D qualification on `2f792fc46364287b9cae147b0874473c3057c8e8`:

- formatting, lint, architecture boundaries and type-check pass;
- 123 Vitest files / 476 tests pass;
- production build passes;
- AI project contract passes;
- immutable deployed startup/save/reload/Continue smoke passes;
- targeted Settings/UI regression passes;
- full compatibility matrix passes with 48 applicable tests and 15 intentional skips across Chromium, Firefox and WebKit desktop/tablet/mobile projects in 7.1 minutes;
- total JS is 653.9 KiB gzip against the unchanged 650 KiB envelope. The budget remains unchanged and this is the only core CI failure before downstream jobs.

H0D therefore satisfies scene identity, composition/scaffolding, proof migration and lifecycle/input-cleanup acceptance and is closed.

## H0E acceptance evidence

H0E redesigned test ownership around stable player/product contracts while preserving meaningful historical regressions and geometry checks. `docs/evidence/wp19h0/test-contract-audit.md` contains the classification contract, critical safety-floor matrix, rewrite/removal ledger and measured runtime/flake baseline. `tests/support/browserDiagnostics.ts` now provides one semantic diagnostics path for scene/object interaction.

Flagged brittle cases were either rewritten or explicitly retained where spatial geometry is itself the contract. No complete test file was deleted. The duplicate second Maple replay browser sequence was consolidated because finite repeat-reward behaviour is already authoritatively covered by `src/game/activities/RepeatableActivityProgress.test.ts`; the browser journey still proves entry, real interaction, persistence and safe return.

Final H0E qualification on `c1bcb8102a22dc04dae928b14d7eb053da40ab7a`:

- formatting, lint, architecture boundaries and type-check pass;
- 123 Vitest files / 476 tests pass in 10.38 seconds;
- production build passes;
- AI project contract passes;
- immutable deployed startup/save/reload/Continue smoke passes;
- inherited targeted Settings/UI regression passes;
- H0E semantic browser regression passes all 19 audited tests in 4.6 minutes; run `34757264316`, artifact `h0e-semantic-contract-regression` / ID `10317457735`;
- total JS remains 653.9 KiB gzip against the unchanged 650 KiB envelope. The budget was not raised.

H0E therefore satisfies test classification, critical-contract ownership, brittle-assertion redesign, removal/rewrite evidence and measured runtime/flake acceptance and is closed.

## H0F acceptance evidence

H0F established the tiered verification model in the canonical `CI` workflow and documented it in `docs/evidence/wp19h0/h0f-tiered-verification.md`. `scripts/verification/verificationPolicy.mjs` classifies docs-only, micro-fix, bounded-feature and full-qualification changes, fails safe on shared/core/build/test-infrastructure or unknown changes, and `scripts/verification/planVerification.mjs` emits both `verification-plan.json` and a human-readable GitHub job summary. Manual full-CI and scheduled full qualification are retained.

The implemented tiers are:

- Tier 0: formatting, lint, architecture boundaries, verification-policy self-tests, conditional type-check and project-contract validation;
- Tier 1: unit contracts, conservatively full until H0G introduces safe deterministic related selection;
- Tier 2: targeted Chromium smoke for bounded feedback;
- Tier 3: authoritative full Chromium playtest in three shards;
- Tier 4: Chromium/Firefox/WebKit compatibility, with immutable deployed smoke kept as a separate exact-candidate qualification workflow.

Qualification exposed two brittle browser-test assumptions rather than product regressions. `183ae2d02567d5d6171dfdd4ed946c4a1a7b5bed` replaced a fixed Settings scroll distance with semantic scrolling to the named accessibility controls. `e9ef0adcace4d88d0d1b73b2382069b56df83041` made the WP19G audio contract first prove `musicEnabled: false`, then scroll until the expanded native track picker is fully inside the H0C containment viewport before asserting it. The supporting-resident timing failure did not reproduce and passed unchanged, so no runtime weakening was made.

Final H0F qualification on `e9ef0adcace4d88d0d1b73b2382069b56df83041`, CI run `34760769833`:

- Tier 0 passes, including formatting, lint, architecture boundaries, verification-policy self-tests, type-check and AI project contract;
- Tier 1 passes 123 Vitest files / 476 tests in 10.18 seconds;
- production build and static smoke pass;
- all three Tier 3 Chromium shards pass;
- Tier 4 cross-browser compatibility passes;
- the inherited performance gate remains the only red check at 653.9 KiB total-JavaScript gzip against the unchanged 650 KiB envelope. The budget was not raised.

H0F therefore satisfies tier separation, automatic escalation, manual/full qualification, scheduled qualification, machine/human selection reporting and preservation of the authoritative final safety floor. Deterministic subsystem ownership and related-test selection now pass to H0G as specified.

## H0G active scope

H0G now owns deterministic affected-test selection. It must add a merge-base changed-file classifier, a version-controlled source/config-to-test ownership map, stable subsystem/product-contract Playwright groups, safe Vitest related/changed selection, explicit escalation globs, machine-readable and human-readable selection evidence, and classifier unit tests. Unknown or unmapped runtime files must fail safe to full qualification, while main/full-WP/release qualification must ignore selective shortcuts and run the complete authoritative suite. H0G should extend the H0F planner and CI topology rather than introduce a second competing verification system.

## Preservation and gates

Preserve saves/IDs/progression/navigation/movement/races, approved UI, responsive/accessibility, conversation/interaction and WP19H audio behaviour. Do not raise performance budgets or delete tests merely to obtain green CI. Complete and inspect each H0 phase before advancing. H0K requires the complete specified suite, cross-browser coverage and immutable preview smoke. Stop after H0K technical qualification for David's explicit approval; no merge, production deployment or H1-H13 work is authorised before that gate.
