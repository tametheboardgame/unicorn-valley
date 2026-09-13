# WP19H0 execution tracker

## Authority and delivery

David authorised H0A-H0K in strict order on one long-lived delivery branch. Codex completed bounded H0A; ChatGPT continued directly in GitHub after Codex/Work usage capacity was exhausted.

- Verified starting main: `ba60ede9ba8697f6015bfb3d79e98152a972403d`.
- Delivery branch: `agent/r6.5-wp19h0-consolidation`.
- Umbrella draft PR: #172.
- Canonical contract: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`.
- Merge/production/H1-H13 remain prohibited until H0K technical qualification and David's explicit approval.

## Phase state

- H0A: complete and accepted.
- H0B: complete and accepted.
- H0C: complete and accepted.
- H0D: complete and accepted.
- H0E: complete and accepted.
- H0F: complete and accepted.
- H0G: complete and accepted.
- H0H: complete and accepted.
- H0I: complete and accepted.
- H0J: complete and accepted.
- H0K: active.

## Phase evidence summary

### H0A - measured baseline

Checkpoint `97167f6b78913c16012f636b5733d04e3e7bff41` established the reproducible architecture, test, bundle and Actions baseline without production behaviour changes. The inventory recorded 35 scene implementations/shared bases, 88 manager/service/coordinator/presenter files and 192 test files. Bundle evidence recorded 471,915 raw entry bytes, 523,453 gzip bytes for the initial/title/first-playable static graph, 666,008 total-JavaScript gzip bytes and 81 JavaScript chunks. The historical 650 KiB total-JS gate failed by 408 bytes.

Primary evidence: `baseline-architecture.md`, `architecture-test-inventory.json`, `baseline-bundle.json`, `ci-timing-baseline.json`, `retirement-candidates.md`.

### H0B - architecture boundary

Established `docs/architecture/RUNTIME-ARCHITECTURE.md`, moved `ContinueRestoreManager` from persistence to application orchestration without changing its save/navigation contract, and added executable architecture boundary checks. Persistence may not depend on scene, UI/presentation or application-orchestration implementation.

### H0C - UI and DOM-overlay consolidation

Established `UiDesignSystem`, reusable `UiPrimitives` and `CanvasDomOverlayBridge`. Settings audio controls became the proof migration for canonical canvas-to-DOM geometry, clipping, z-order, sizing and lifecycle ownership while preserving native accessibility semantics and approved presentation.

### H0D - scene composition and lifecycle

Established `SceneManifest`, `StartupSceneRegistry`, typed scene composition declarations, `SceneLifecycleScope` and reusable scene input ownership without introducing a giant base class. Stable scene/save identities were preserved. `R6VillageInteriorScene` became the explicit owner of the stable `VillageInteriorScene` key.

### H0E - test-contract redesign

Audited tests against stable player/product contracts, replaced brittle raw-coordinate/index assumptions where semantic hooks were appropriate, retained genuine geometry contracts, and introduced shared browser diagnostics. No complete test file was deleted without retirement evidence.

Primary evidence: `test-contract-audit.md`.

### H0F - tiered verification

Established Tier 0 static/architecture checks, Tier 1 unit contracts, Tier 2 targeted Chromium smoke, Tier 3 full three-shard Chromium and Tier 4 Chromium/Firefox/WebKit compatibility. The final safety floor remained authoritative even while development feedback became selective.

Primary evidence: `h0f-tiered-verification.md`.

### H0G - deterministic affected-test ownership

Extended the H0F planner with merge-base changed-file classification, version-controlled source/config-to-test ownership, selected unit/browser runners, machine-readable selection evidence and fail-safe escalation. Unknown/unmapped runtime or shared/core/build/test-infrastructure changes escalate to authoritative full qualification. Current H0J classification has `unmappedFiles: []` and correctly selects Tiers 0, 1, 3 and 4 with `authoritative-full` ownership.

### H0H - performance architecture

Replaced the historical total-JavaScript breadth ceiling as a hard failure with player-visible/architecture budgets: 520 KiB raw entry, 560 KiB gzip initial/title/first-playable graph, 32 KiB gzip largest lazy chunk and 112 JavaScript chunks. Diagnostics must remain lazy, material duplicate chunks are guarded, and total JavaScript remains reported as trend evidence. Vite preload-error recovery handles stale lazy chunks after deployments.

On H0J checkpoint `69c75662572d9bf38406ed8b393d5c9b914f04b2`, CI measured 469.5 KiB raw entry, 514.6 KiB gzip first-playable across 26 chunks, 7.8 KiB gzip largest lazy chunk and 82 JavaScript chunks. All hard budgets pass. Total breadth is 654.1 KiB gzip and remains visible as trend evidence.

Primary evidence: `h0h-performance-architecture.md` and CI run `34767743173` performance artifact `10321128624`.

### H0I - engineering standards

Created `docs/architecture/ENGINEERING-STANDARDS.md` and updated agent/testing/development entry points so future work uses the canonical scene, UI, overlay, interaction, audio, verification and performance systems rather than rediscovering or duplicating them.

### H0J - migration and retirement

Deleted the proven-obsolete pre-R6 `src/game/scenes/VillageInteriorScene.ts` while retaining the stable scene key and canonical R6 owner. Architecture validation now fails if the retired path returns. Compatibility managers that still own accepted runtime behaviour were explicitly retained with owners and review milestones rather than deleted speculatively.

Primary evidence: `h0j-migration-retirement.md`.

## H0K qualification candidate

The H0J code/evidence checkpoint is `69c75662572d9bf38406ed8b393d5c9b914f04b2`. CI run `34767743173` selected `full-qualification` with Tiers 0, 1, 3 and 4, full unit ownership and no unmapped files.

Evidence already green on that exact checkpoint:

- Tier 0: format, lint, architecture boundaries, verification policy, performance policy, type-check and AI project contract;
- Tier 1: 124 Vitest files / 479 tests in 9.66 seconds;
- production build;
- static smoke over 28 referenced assets and deployment cache policy;
- H0H performance architecture budget and report.

At this tracker update, all three Tier 3 Chromium shards and Tier 4 compatibility are queued/running. H0K will use the final documentation/state candidate as the exact authoritative CI candidate, so these H0J browser results are supporting pre-final evidence rather than a substitute for final-head qualification.

## Gate

H0K is not technically complete until the final candidate passes the complete authoritative CI path and an immutable Cloudflare Pages preview of that exact candidate passes startup, save, reload and Continue smoke. After those gates pass, durable state must move to `waiting_human` and work must stop for David's explicit approval. No merge, production deployment or H1-H13 work is authorised before that approval.
