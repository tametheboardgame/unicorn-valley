# C18 Multi-order Resonance Garden: queue and safe-save design gate B

Status: **implementation candidate; not approved for persistence migration or live gameplay activation**  
Date: 31 October 2026  
Owner: World / Crystalarium H6.9C, draft PR #337  
Authoritative roadmap: `docs/work-packages/R6.5-WP19H6.9C17-C24-CRYSTALARIUM-ILLUSTRATED-REDESIGN-ROADMAP.md`

## Scope and what has actually started

The pure C18 queue is implemented separately in `CrystalariumMultiOrderRules.ts` with a dedicated unit-test suite. It does **not** change current v1 records, `FullMode`, `CrystalariumFullPersistence`, `saveSchema`, `saveValidation` or any existing player save. Current gameplay remains one active order. Existing accepted illustration, 7×6 sockets, four-slot Storage, generator input and pouring animation are frozen.

This checkpoint enables independent validation of the prospective v2 contract **before** choosing the migration timing or writing new save data.

## Proposed version-2 record

- Keep every established v1 field byte-for-byte in content: `cells[42]`, `shelf[4]`, `merges`, `offers`, `washes`, `harmonies`, `discovered`, `selectedFamily`.
- Set the nested Crystalarium progress `version: 2` (distinct from the global adventure `schemaVersion: 10`).
- `completedPatternIds: string[]` is a unique ledger of the fixed authored IDs, in actual completion order. Legacy `completed=N` maps to the **first N** authored pattern IDs. Existing 50 IDs (`crystalarium:chapter-order`) never change.
- Retain `completed` as a **derived, validated compatibility count**, exactly `completedPatternIds.length`. This allows existing family unlock (0/4/7), refined generator (20/40), later polish (30), chapter milestones and guide logic to read the established count. Never let the count disagree with the ledger.
- `revealedCount` is a monotonically increasing cursor into the original 50-item ordered catalogue. The displayed queue is precisely `RESONANCE_PATTERNS.slice(0, revealedCount)` excluding IDs in the completed ledger. Revealed order stays stable, including when a later card is completed first.
- **Proposed progression for playtest:** one active order for the untouched first lesson; two after first completed order; three from first chapter completion (10) onwards. Final stages display the remaining available order(s), never ghost slots. Later expansion to 4–5 cards requires separate readability sign-off.

## Atomic offer contract

A proposed `offerQueuedPattern(state, patternId)` must reject unknown, unrevealed, already-completed or unaffordable IDs without mutating the original state or any inventory. It must identify the exact pieces meeting all goal quantities across board and shelf; take each at most once; decrement harmony costs once; append just the successful pattern ID; increment `offers` and derived `completed` once; and reveal the next eligible authored ID(s) to preserve active slots. Other cards' readiness is **always** recomputed against the resulting inventory, avoiding double consumption when goals overlap. Save the entire accepted result atomically before announcing success.

## Migration and rollback gates (not yet executed)

1. **Gate B review:** inspect proposed queue/legacy conversion, first-lesson and chapter-unlock behaviour, source isolation, error handling and 50-order deterministic tests; approve the exact v2 save contract before changing either writer.
2. Extend `saveSchema.ActivityState.crystalarium`, `saveValidation.isActivityState`, `CrystalariumFullPersistence`, world save migration/reconciliation and all relevant unit tests **in a single gated code package**. Existing `SaveService` validates the full adventure `SaveGame`; adding nested v2 without this update could invalidate all world saves, so it must not be staged as an isolated gameplay change.
3. Define whether world schema bump/backup checkpoint is required; preserve older global-version checkpoints and document rollback safety. An older client cannot safely overwrite newer nested v2 records. Sandbox remains isolated on its dedicated key, with v1 read/migrate and atomic v2 writes. Do not reset a valid v2 to v1 after a failed write.
4. Validate old v1 N=0/1/4/7/10/49/50, legacy shelf preservation, reload from both return routes, corrupt/future versions, checkpoint recovery, failed writes, separate Just Games versus world, original Grotto gate, double-click and simultaneous ready patterns. Validate unmodified world quests/inventory/flags and full 50-order no-hard-wait solver.
5. UI activation only after migration acceptance: horizontally scroll several cards without shrinking the board; one highlighted ready card offers exactly its own ID; maintain guide actions and keyboard/drag parity.

## Current evidence and remaining work

Pure tests cover legacy preservation, duplicate/forged/future state refusal, deterministic initial/2/3-card reveals, non-sequential offering, overlap/double spend, harmony deduction, specific board/shelf pieces and a 50-order queue completion pass. The older `CrystalariumCampaignSolvability.test.ts` independently proves all 50 formations can be grown using legal v1 growth/merges; after v2 activation, extend that solver through queued offers and persistence.

**Hard stop:** No writes to nested v2 records, no world `SaveGame` migration, no real-time order cards and no declaration of C18 completion until the Gate B save design is accepted, exact-head CI is green and the owner has reviewed the staged behaviour. PR #337 remains draft and unmerged.
