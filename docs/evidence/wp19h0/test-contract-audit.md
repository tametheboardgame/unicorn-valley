# H0E test-contract audit

## Scope and source inventory

H0E treats `docs/evidence/wp19h0/architecture-test-inventory.json` as the exhaustive file-level test inventory produced in H0A. That inventory already assigns every discovered unit/browser test a subsystem and product-contract classification. H0E refines the meaning of those classifications, audits the explicitly flagged brittle files, records the critical safety floor and defines the verification tiers that H0F will implement.

No test file is deleted merely because it is old or WP-numbered. Historical regressions remain valuable while their failure mode is plausible. Geometry assertions remain where geometry is the user contract. Pure domain rules should not be re-proved through expensive browser interaction when a direct unit contract already owns them.

## Classification contract

- **critical product contract**: boot, new game, save/load/Continue, core navigation and return position, critical input/movement, production/deployment health.
- **feature contract**: stable observable behaviour of one subsystem, independent of private implementation structure.
- **visual/layout contract**: automated geometry, visibility, touch size or responsive behaviour where those measurements are themselves the product requirement.
- **implementation-detail test**: assertion tied to private collection order, internal object count or equivalent implementation structure without player-facing meaning; rewrite candidate.
- **duplicate coverage**: expensive integration/browser proof of a rule already authoritatively and more cheaply covered at domain/unit level; consolidate while preserving an integration journey.
- **historical regression**: protects a previously observed defect whose failure mode is still plausible.
- **obsolete/stale**: behaviour is demonstrably retired and has replacement/retirement evidence. None are removed in this checkpoint without such evidence.
- **flaky/environmental**: failure comes from runner/browser/environment startup rather than a product assertion; repair or quarantine only with explicit ownership and evidence.

## Critical safety floor

| Player/product behaviour | Primary owner | Test level | Current owner/test path | Intended CI tier |
| --- | --- | --- | --- | --- |
| Production boot and fingerprinted local assets | application/deployment | browser | `tests/play/r6-wp6.9-browser-deployment.spec.ts` | Tier 2 + final |
| Immutable deployed startup, save, reload and Continue | deployment/persistence | deployed browser | `tests/deployment/deployed-startup-save-continue.spec.ts` | final qualification |
| Save schema, migration, storage faults and reset | persistence | unit | `src/game/save/SaveService*.test.ts`, `saveMigrations.test.ts` | Tier 1 |
| Continue destination and checkpoint ordering | persistence/application | unit + browser | `ContinueLocation.test.ts`, `SaveService.checkpointOrdering.test.ts`, `r6.5-world-state-continue.spec.ts` | Tier 1 + Tier 2 |
| New game/front door actions | title/onboarding | browser | `r6-wp6.11-main-menu-deluxe.spec.ts` | Tier 2 |
| Core keyboard/touch/click movement | input/player | unit + browser | `InputController.test.ts`, `PlayerMovement.test.ts`, `TouchMovementPad.test.ts`, browser playtest/device contracts | Tier 1 + Tier 2 |
| Scene navigation and return positions | world/application | unit + browser | `RegionGatewayRules.test.ts`, `WorldArrivalState.test.ts`, `r6.5-wp19b-world-navigation.spec.ts` | Tier 1 + Tier 2 |
| Interaction ownership/proximity | interaction | unit + browser | `UnifiedInteractionOwnership.test.ts`, `InteractionTargeting.test.ts`, automated playtest | Tier 1 + Tier 2 |
| Responsive touch/readability/accessibility | UI/accessibility | unit + browser | `AccessibilitySettings.test.ts`, portrait/device/UI browser contracts | Tier 2 + final cross-browser |
| Cross-browser production compatibility | application/UI/input | browser matrix | `playwright.compat.config.ts` selected compatibility suite | final cross-browser |

## Brittle-test rewrite ledger

### Rewritten in H0E

- `r6-wp6.11-main-menu-deluxe.spec.ts`: replaced an implementation-sensitive `count() === 8` plus index loop with explicit semantic setting action IDs. Touch-size assertions remain because physical target size is the contract.
- `r6.5-wp14-repeatable-activities.spec.ts`: replaced raw canvas coordinates with named diagnostic objects. Removed the second Maple replay from the browser journey because finite/repeat reward semantics are already directly owned by `src/game/activities/RepeatableActivityProgress.test.ts`; the browser still proves entry, real interaction, persistence and safe return.
- `r6.5-wp15-wonderbook-progress.spec.ts`: replaced absolute tab x/y/count ordering assertions with explicit semantic section identities. Dedicated responsive/visual tests remain responsible for layout geometry.
- `r6.5-wp16-portrait-modal-readability.spec.ts`: replaced the raw Maple entry coordinate with the named activity entry object. Font and minimum touch-size measurements remain because readability is the product contract.
- `r6.5-wp18e-bag-map-food.spec.ts`: replaced the raw exploration Map coordinate with `exploration-shell-map-button`. Creator containment measurements remain because artwork containment is the behaviour being protected.

### Deliberately retained

- `r6.5-wp18g-device-hardening.spec.ts`: geometry/viewport assertions remain because this file is a visual/device-hardening contract. The desktop click-to-move point remains coordinate-based because spatial pointer movement is the behaviour under test, not an implementation detail.
- Other visual/layout files remain coordinate/geometry-capable where the assertion is about clipping, safe areas, containment or responsive placement. H0E does not convert meaningful geometry into weaker existence assertions.

### Removal policy

No entire test file is removed in this checkpoint. A test may be removed later only when the ledger names its stable replacement or supplies evidence that the underlying behaviour is retired. WP-numbered names are retained for now because renaming alone would add churn without improving ownership; contract ownership is captured here and in the H0A machine-readable inventory.

## Shared browser diagnostics fixture

`tests/support/browserDiagnostics.ts` establishes one reusable path for diagnostics boot, snapshots, scene waits/starts, named-object waits/clicks and sprite positioning. Named-object clicking converts logical game coordinates through the diagnostic snapshot and current canvas bounds, so tests no longer embed arbitrary screen coordinates merely to activate known controls.

## Final H0E qualification

Final qualification head: `c1bcb8102a22dc04dae928b14d7eb053da40ab7a`.

- Formatting, lint, architecture boundaries and type-check passed.
- Vitest passed 123 files / 476 tests in 10.38 seconds.
- Production build passed.
- AI project contract validation passed.
- Immutable deployed startup/save/reload/Continue smoke passed.
- The inherited targeted Settings/UI browser regression passed.
- H0E semantic contract run `34757264316` passed all 19 audited Chromium tests in 4.6 minutes. Evidence artifact: `h0e-semantic-contract-regression`, artifact ID `10317457735`.
- The inherited performance gate remains visible and unchanged at 653.9 KiB total-JavaScript gzip versus the 650 KiB envelope.

## Flake and runtime baseline

H0A timing evidence in `ci-timing-baseline.json` records Validate at roughly 26-28 seconds, unit tests around 10 seconds and production build around 2-3 seconds on sampled successful runs. Full Chromium playtest shards are materially more expensive, with sampled execution around 521-1,003 seconds per shard. Browser compatibility sampled around 411-485 seconds end-to-end, with the browser step itself around 344-420 seconds. Immutable deployed smoke is roughly one minute in the captured sample.

The clean H0D compatibility run `34756628024` completed 48 applicable cases with 15 intentional portrait/project skips across Chromium, Firefox and WebKit desktop/tablet/mobile projects in 7.1 minutes. An earlier H0C WebKit-tablet attempt timed out before canvas visibility and then passed on an unchanged-code rerun in 1.4 seconds. This is classified `flaky/environmental`, owned by browser startup/compatibility infrastructure. It is not silently skipped, converted into a product pass or used to weaken assertions.

The final H0E semantic regression ran 19 audited Chromium tests serially in 4.6 minutes. This provides a measured Tier 2-style subsystem baseline and reinforces the need to reserve full multi-browser/multi-shard qualification for higher-risk/final gates.

## H0F hand-off

The runtime evidence supports a tiered model: static/architecture and unit contracts should give fast feedback before expensive browser work; focused semantic browser contracts should run for relevant changes; full playtest shards, compatibility and immutable deployed smoke remain final qualification. H0F must implement this ordering without raising the inherited performance budget or reducing the H0K safety floor.
