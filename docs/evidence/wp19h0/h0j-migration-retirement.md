# WP19H0 H0J migration and retirement evidence

Decision date: 2026-09-13

## Scope and rule

H0J removes only compatibility or duplicate paths whose callers, registration ownership and replacement behaviour can be proven from the current branch. A candidate that still owns accepted runtime behaviour is retained with an explicit owner and review milestone rather than deleted speculatively.

The H0A retirement ledger remains the before-state. This document records the H0J disposition.

## Retired in H0J

### Duplicate `VillageInteriorScene.ts`

**Disposition:** removed.

The stable scene key remains `VillageInteriorScene`. H0D's `SceneManifest` assigns that key to `R6VillageInteriorScene.ts`, the startup registry does not register the pre-R6 implementation, and bootstrap registers the R6 implementation under the same stable key. The H0A inventory recorded both implementations, which was the ambiguity H0J needed to remove.

H0J deleted `src/game/scenes/VillageInteriorScene.ts` without changing the stable key, navigation payload or save-facing identity. `scripts/architecture/architectureBoundaries.mjs` now marks the retired source path and `architecture:validate` fails if it is reintroduced. The architecture self-tests cover both rejection of the retired path and acceptance of `R6VillageInteriorScene.ts`.

This slice is independently revertible and changes no live registration owner.

## Retained candidates

| Candidate | H0J disposition | Current evidence / reason retained | Owner and next review |
| --- | --- | --- | --- |
| `LegacyWorldFeedbackMigrationManager` | Retain | Still installed by `src/main.ts` and still contains recognised legacy names/backgrounds/patterns. Removing it before every producer is migrated would expose or relocate accepted guidance/reaction/discovery feedback. | Area/message migration owner during H1-H13. Review after each affected area migration and at the H13 completion gate. |
| `DesktopConceptCleanupManager` | Retain | Bootstrap still loads it. `src/main.ts` explicitly records that it remains temporarily responsible for scene-owned legacy world copy while the exploration shell is canonical. | H1-H13 area presentation owner. Review whenever an area removes its remaining legacy producer; final review at H13 completion. |
| `PortraitConceptPresentationManager.suppressLegacy` | Retain | Portrait presentation is still bootstrap-loaded and protects the accepted portrait shell/rotation behaviour. H0C established the shared UI/overlay contract but did not prove deletion of every portrait legacy producer. | Responsive UI owner. Review at each portrait-affecting H1-H13 slice and at H13 completion. |
| `CoreSceneInteractionBridge` prototype capture | Retain | The bridge is patched before Phaser game construction and its runtime owner is still installed. Removing it now would be a broad interaction-input migration rather than a bounded retirement. | Interaction architecture owner. Review when remaining scene activators have moved fully to the canonical registry/coordinator. |
| `LandscapeCreatorProgressiveManager` legacy-control suppression | Retain | The manager is still installed globally and the creator is a frozen human-approved surface. Removing hidden/recomposed creator controls needs dedicated responsive/reset/randomise/re-entry parity evidence. | Creator UI owner. Review on the next explicitly approved creator migration, not opportunistically in H0. |
| `R6FinalPlaythroughCleanupManager` | Retain | Still loaded with the region gateway presentation group. Named producer-by-producer deletion has not been proven across all supported layouts. | Area presentation owner. Review during the corresponding H1-H13 area polish slice; final review at H13 completion. |
| `FinalGraphicsTighteningManager` legacy stream suppression | Retain | Still loaded by bootstrap presentation composition. The accepted replacement geometry and producer removal require visual/geometry evidence rather than architecture-only deletion. | Area presentation owner. Review in the affected H1-H13 area slice. |
| `ExplorationGeometryPresentationManager.replaceLegacyHint` | Retain | The manager remains an immediate application owner in `src/main.ts`. The legacy hint producer has not yet been safely migrated to the canonical feedback owner across all relevant scenes. | Exploration/message owner. Review during H1-H13 scene migrations and at H13 completion. |
| `WorldTraversalPolishManager.hideLegacyGatewayObjects` | Retain | H0A identified this as cleanup-by-scanning overlapping gateway ownership. H0J has no complete producer/geometry parity proof for all gateway variants, so deletion would be speculative. | Gateway/area presentation owner. Review during each gateway-bearing H1-H13 area migration. |
| Bootstrap-immediate runtime registrations | Retain deliberately | H0D/H0H replaced historical ambiguity with explicit manifest loading boundaries. Current startup/first-playable measurements have comfortable headroom, so changing additional runtime-eager boundaries without measured benefit would add transition risk for no demonstrated player benefit. | Performance/scene architecture owner. Re-measure when first-playable or lazy-chunk budgets materially regress. |
| WP-numbered browser organisation and brittle assertions | Migrated/retained selectively | H0E audited the suite, rewrote brittle semantic assumptions and consolidated proven duplicate coverage. Historical filenames are not themselves a runtime architecture defect and wholesale renaming would create churn without additional protection. | Test architecture owner. New tests must use the H0E/H0I semantic ownership model; rename/remove older tests only when their contract is otherwise being changed. |

## Migration conclusion

H0J deliberately removes the one scene implementation whose replacement ownership is fully proven and prevents that path from returning. The remaining compatibility managers are not dead code: current bootstrap still installs them or H0A identified unresolved producer dependencies. They therefore remain explicit debt with named migration ownership instead of being hidden or deleted to make the architecture appear cleaner than the runtime actually is.

This satisfies the H0 rule that a compatibility path is deleted only after replacement proof. H0K must now qualify the deletion/guard on the authoritative full suite and record any remaining debt in the final engineering report.
