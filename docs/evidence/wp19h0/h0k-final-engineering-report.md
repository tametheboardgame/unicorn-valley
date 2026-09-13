# WP19H0 H0K final engineering report

Qualification status: **in progress**

- Delivery PR: #172
- Branch: `agent/r6.5-wp19h0-consolidation`
- Verified baseline main: `ba60ede9ba8697f6015bfb3d79e98152a972403d`
- H0A measured source checkpoint: `97167f6b78913c16012f636b5733d04e3e7bff41`
- H0J implementation/evidence checkpoint: `69c75662572d9bf38406ed8b393d5c9b914f04b2`
- Merge/production status: not merged, not deployed

This report is the H0K qualification package. It becomes technically complete only after the final candidate SHA passes the complete authoritative CI path and exact-SHA immutable preview smoke.

## Executive result

H0A-H0J have consolidated architecture, UI/DOM overlay ownership, scene composition/lifecycle, test contracts, CI selection and performance policy while preserving stable save-facing identities and accepted game behaviour. The programme deliberately removed only one compatibility path whose replacement ownership was proven: the duplicate pre-R6 `VillageInteriorScene.ts`. Other compatibility managers remain explicit, owned migration debt rather than being deleted to make the architecture appear cleaner than the runtime is.

The principal inherited engineering failure was a 650 KiB total-JavaScript hard ceiling that measured total optional game breadth rather than player-visible startup. H0H replaced it with measured entry, first-playable, lazy-chunk, chunk-count, diagnostics and duplicate-payload guardrails. The historical 650 KiB figure remains visible as a trend metric.

## Architecture before and after

| Area | H0A before | H0A-H0J after |
| --- | --- | --- |
| Composition | `src/main.ts` mixed synchronous owners, immediate dynamic registrations and presentation/content installers with implicit lifetime ownership. | Canonical `SceneManifest`, `StartupSceneRegistry`, typed `SceneCompositionContract`, `SceneLifecycleScope` and documented engineering standards make identity, loading boundary, lifetime and teardown explicit. |
| Persistence boundary | Application orchestration existed under persistence ownership in places such as Continue restoration. | `ContinueRestoreManager` moved to application orchestration; executable architecture rules prevent persistence from importing scene/UI/application implementation. |
| Scene identity/loading | Static config plus several ad-hoc runtime registration paths; duplicate Village Interior implementations shared one runtime key. | Stable keys are catalogued in `SceneManifest`; startup/runtime-eager/on-demand ownership is explicit; only `R6VillageInteriorScene` owns the stable Village Interior implementation. |
| UI styling | `uiTheme`, `ConceptUi`, scene-local geometry and feature CSS overlapped. | `UiDesignSystem` is the canonical token source, `UiPrimitives` owns reusable canvas patterns and existing approved styling is derived through the canonical contract. |
| DOM overlays | Settings, creator, portrait, race and interaction overlays each performed bespoke canvas/DOM geometry or lifecycle work. | `CanvasDomOverlayBridge` owns supported geometry, scaling, containment, visibility and teardown; Settings audio controls are the proof migration. |
| Tests | 120 unit files and 72 browser/deployment files, many named by delivery history; some browser checks coupled to indexes/raw coordinates. | Critical product contracts are classified, semantic browser diagnostics are shared, brittle assertions were redesigned selectively, and current unit coverage is 124 files / 479 tests. |
| CI | Full browser cost was broadly coupled to ordinary change feedback. | Deterministic merge-base classification and ownership mapping select bounded feedback where proven and fail safe to full qualification for core/shared/unmapped changes. |
| Performance | Total emitted JS above 650 KiB failed even when startup graph was healthy. | Player-visible hard budgets cover entry, first-playable graph, largest lazy chunk and chunk count; diagnostics/duplicate payload are guarded; total JS is trend-only. |
| Deployment resilience | A stale page could reference a removed hashed lazy chunk after deployment. | Vite preload-error recovery provides bounded stale-chunk reload behaviour while immutable asset caching is preserved. |

## Bootstrap and runtime ownership

H0A identified 35 scene implementations/shared bases and 88 manager/service/coordinator/presenter files. The composition root mixed game-lifetime synchronous owners, runtime-eager asynchronous installers, capability-conditional owners and genuinely scene/feature-owned services.

H0D/H0I now define the ownership model rather than pretending every dynamic import is optional runtime work:

- startup registration is explicit through `StartupSceneRegistry`/manifest metadata;
- runtime-eager registrations remain explicit where they own accepted game behaviour;
- on-demand surfaces such as Settings, Starlight Beach and optional activity/HUD paths remain lazily registered where the product contract already supports it;
- scene-owned cleanup is expressed through `SceneLifecycleScope` instead of relying on broad global teardown conventions.

H0J intentionally retained several global compatibility/presentation managers because current bootstrap still installs them or because producer-by-producer parity has not been proven. Their owners and review milestones are in `h0j-migration-retirement.md`.

## UI consolidation

H0C established `UiDesignSystem`, `UiPrimitives` and `CanvasDomOverlayBridge` without redesigning the already approved visual language. The Settings audio range/select controls prove that native accessible controls can use the shared bridge while retaining semantics, touch sizing, clipping, z-order and scroll containment. Existing canvas concept styling consumes the canonical design contract rather than creating a parallel replacement theme.

Portrait and creator compatibility paths remain where deleting them would require dedicated responsive/human-approved visual evidence. H0J records those as explicit debt rather than treating suppression code as dead solely because a canonical UI system now exists.

## Scene standards

`SceneManifest`, `SceneCompositionContract`, `SceneLifecycleScope` and the new-scene recipe establish the required scene declaration surface: stable identity, loading boundary, audio, persistence, spawn/return, shell/HUD, interaction, responsive behaviour, teardown and test ownership. H0D used a low-risk proof migration and retained stable keys/save IDs. H0J then removed the duplicate Village Interior implementation only after the manifest, bootstrap and caller evidence agreed on the R6 owner.

## Legacy removal and retained debt

Removed in H0J:

- `src/game/scenes/VillageInteriorScene.ts` (pre-R6 duplicate). The stable `VillageInteriorScene` key and canonical `R6VillageInteriorScene` behaviour remain unchanged.
- Architecture validation now rejects reintroduction of the retired path.

Retained for later producer migration/review:

- `LegacyWorldFeedbackMigrationManager`;
- `DesktopConceptCleanupManager`;
- `PortraitConceptPresentationManager.suppressLegacy`;
- `CoreSceneInteractionBridge` prototype capture;
- `LandscapeCreatorProgressiveManager` legacy-control suppression;
- `R6FinalPlaythroughCleanupManager`;
- `FinalGraphicsTighteningManager` legacy stream suppression;
- `ExplorationGeometryPresentationManager.replaceLegacyHint`;
- `WorldTraversalPolishManager.hideLegacyGatewayObjects`;
- deliberately runtime-eager registrations where current first-playable measurements do not justify migration risk.

These are not declared dead code. H1-H13 area/product slices own the relevant producer migrations and H13 owns the final broad review where specified.

## Test and CI evidence

H0A baseline inventory recorded 120 unit files plus 72 browser/deployment files. Successful pre-H0 full-suite timing context included run `34744288460`: Validate 28 s, Chromium shards 521/944/978 s, compatibility 485 s and approximately 16m49s workflow wall time. An independent preceding run recorded 27 s, 610/969/1003 s and 411 s compatibility. Queue time in those baseline samples was 2-3 s.

H0F/H0G separate feedback cost from qualification confidence. Selective CI is an optimisation only; shared/core/build/test-infrastructure, unmapped changes, main/release/manual full qualification all escalate to the complete authoritative floor.

On H0J checkpoint `69c75662572d9bf38406ed8b393d5c9b914f04b2`, run `34767743173` classified the PR as `full-qualification`, selected Tiers 0/1/3/4, selected full units and reported no unmapped files. Tier 0 passed. Tier 1 passed 124 Vitest files / 479 tests in 9.66 s. Production build, static smoke and performance architecture also passed. The three Chromium shards and cross-browser matrix were runner-queued at the time this qualification candidate was prepared; the final H0K candidate must rerun and pass them regardless of those supporting results.

The branch accumulated multiple historical PR runs because sequential checkpoint commits each triggered CI and the workflow does not cancel older in-flight runs. This queueing is operational evidence, not a product failure, and H0 does not change CI concurrency late merely to make the qualification queue appear faster.

## Bundle and performance before/after

| Metric | H0A baseline | H0J measured | H0H hard budget |
| --- | ---: | ---: | ---: |
| Entry JavaScript raw | 460.9 KiB | 469.5 KiB | 520 KiB |
| Entry JavaScript gzip | 123.3 KiB | 126.0 KiB | trend |
| Initial/title/first-playable gzip | 511.2 KiB | 514.6 KiB | 560 KiB |
| Largest optional/lazy JS gzip | about 8 KiB | 7.8 KiB | 32 KiB |
| JavaScript chunks | 81 | 82 | 112 |
| Total JavaScript gzip | 650.398 KiB | 654.1 KiB | trend only; historical 650 KiB retained for visibility |
| Diagnostics in initial graph | no | no | must be no |

The current graph therefore has deliberate player-visible headroom despite the game containing more engineering/test/runtime breadth. No calibrated device/network title-to-first-playable runtime trace existed at H0A, so this report does not manufacture a before/after millisecond claim. Bundle graph measurements and immutable functional deployment smoke are kept distinct.

## Performance budget rationale

- 520 KiB raw entry preserves the pre-existing entry ceiling rather than increasing it.
- 560 KiB gzip first-playable provides roughly 9.5% headroom above the measured H0A 511.2 KiB graph while directly protecting the player-visible startup path.
- 32 KiB largest lazy chunk is materially above normal feature chunks but low enough to catch accidental monoliths.
- 112 chunks leaves expansion headroom from the 81-chunk baseline while guarding request fragmentation.
- Diagnostics must remain outside startup.
- Material duplicate payloads are guarded independently of chunk count.
- Total JavaScript breadth remains visible for trend review but is not confused with startup cost.

## H0K final qualification checklist

The final candidate must pass all of the following on the candidate SHA that is presented for approval:

- format;
- lint;
- type-check;
- architecture/retirement guardrails;
- verification/performance policy tests;
- complete Vitest suite;
- production build;
- static smoke;
- H0H performance budgets;
- all three Chromium shards;
- Chromium/Firefox/WebKit compatibility;
- AI project operating-contract validation;
- immutable Cloudflare Pages startup/save/reload/Continue smoke against that exact candidate SHA.

Until all items are green, H0K remains in progress. Once they pass, durable state must move to `waiting_human` and work must stop for David's explicit approval. No merge, production deployment or H1-H13 work is authorised before that approval.
