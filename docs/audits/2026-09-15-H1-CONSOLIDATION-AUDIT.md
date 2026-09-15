# H1 consolidation audit - 15 September 2026

Scope: R6.5-WP19H1.1 through H1.10 on the Moonflower Glade delivery branch.

Purpose: identify approved H1 behaviour that was still implemented through duplicate ownership, legacy suppression, coordinate-based cleanup or unnecessary high-frequency reconciliation, then consolidate it without redesigning the approved player experience.

## Final state

**Audit complete and accepted on 15 September 2026.** All identified H1-specific consolidation work described below was completed before merge approval. The final qualified runtime head before documentation-only completion commits was `8dff0c5f9bd1c49212b5cb9d14d177d32483587f`.

Qualification on that head was fully green:

- formatting, lint, architecture, verification-policy and performance-policy checks passed;
- TypeScript type-check and project contract validation passed;
- selected unit contracts passed;
- production build, static smoke and performance architecture passed;
- all three full Chromium shards passed;
- Firefox/WebKit/Chromium compatibility passed.

David then explicitly authorised final documentation updates, merge and deployment. No unresolved H1.11 blocker remains. The documentation-only completion commits do not alter runtime behaviour; their own selected verification must still pass before merge.

## Executive findings

The audit confirmed the concern raised after H1.10: incremental visual delivery had left several places where a newer production system was correcting an older scene implementation after both had been created.

The most important examples were:

- Moonflower Glade created its original paths, then the path-polish manager scanned/destroyed legacy depth-2 graphics;
- the scene created an old stream surface/highlights while `MoonflowerStreamLife` later scanned/destroyed them;
- `VisualTighteningManager` created old small Glade reed groups while `MoonflowerStreamLife` repeatedly searched for and removed them;
- the scene created label-style destination text while H1.10 created physical signs and then ran delayed cleanup to suppress the old labels;
- H1.10 tree/flower corrections used coordinate-based presentation cleanup rather than owning the final source geometry;
- the scene retained a prototype Pip and local interaction/dialogue/prompt stack after shared production owners had replaced them;
- Pip story/presentation managers still scanned scene children to hide that prototype and locate the known tutorial sparkle;
- the H1.10 Old Garden Gate flower bug ultimately came from a separate production decoration container, proving why coordinate-based top-level cleanup was unreliable.

## Consolidation completed

### Moonflower Glade scene

`MoonflowerGladeScene` is now a substantially smaller production scene.

It owns:

- base terrain/background;
- western gate and bridge structure;
- cottage invocation;
- Home Meadow invocation;
- Hollow Tree/base field/boundary scenery;
- player movement/collision/camera;
- the first green sparkle object/state callback.

It no longer owns superseded local versions of:

- polished paths;
- stream water/highlights/reeds/fish;
- physical signs/legacy sign labels;
- growing-plot presentation;
- prototype Pip;
- local explicit interaction prompt/target selection/activation;
- local dialogue card/session;
- old HUD/feedback text which duplicated the shared exploration shell/feedback language;
- the retired Moonflower Field threshold glimmer.

The reviewed right-edge Moonflower Field corrections now live at the field source: the bad blue bloom is drawn with ordered blossom geometry and the unwanted overlapping pink bloom is not created.

The top garden-edge trees are also authored at their approved positions rather than moved after creation.

### Final Glade signs/gardens

`MoonflowerGladeFinalPresentation.ts` replaces the checkpoint-specific H1.10 presentation file.

It owns exactly the approved:

- Old Garden Gate physical sign;
- Sunbeam Village direction sign;
- garden connector path;
- main/upper/stream-bank growing plots.

It contains no delayed label cleanup, coordinate deletion pass or tree relocation pass.

The old `MoonflowerGladeH110Presentation.ts` workaround file has been deleted.

### Path ownership

`ExplorationPathPolishManager` still owns the approved Glade route rendering, but its Glade-specific legacy suppression scan has been removed. The base scene no longer creates the competing old path layer.

### Stream ownership

`MoonflowerStreamLife` now directly owns the stream surface, irregular marks, reed beds, ambient fish and stable fishing hook.

Removed:

- legacy stream primitive scan/destruction;
- legacy reed-centre coordinate list;
- repeated child-list scan used to remove `VisualTighteningManager` reeds.

`VisualTighteningManager` no longer decorates Moonflower Glade at all; its old Glade reed source has been retired.

### Interaction ownership

Moonflower Glade no longer exposes/uses its old local explicit interaction activator.

`CoreSceneInteractionBridge` now treats Glade as registry-native while preserving a bounded compatibility bridge for Sunbeam Village and Rainbow Meadow. Legacy prompt destruction for those older scenes runs once per scene instance rather than every game step.

This intentionally leaves Village/Meadow migration outside H1 rather than broadening this checkpoint into a whole-world interaction rewrite.

### Pip ownership

The base Glade scene no longer creates prototype Pip art.

Consequently:

- `PipEggWorldManager` no longer performs a per-frame coordinate/type scan to hide prototype Pip;
- the known first tutorial sparkle is looked up by its stable name rather than by coordinate and glyph inspection;
- `CoreNpcProductionPresentationManager` no longer scans around Pip's coordinates to hide a placeholder before creating canonical Pip;
- the core NPC manager now unregisters its `POST_STEP` listener on game destruction.

### Qualification regressions resolved

The consolidation exposed several real or stale qualification failures which were resolved without restoring superseded Glade architecture:

- interaction presentation no longer initialises movement infrastructure with the wrong pointer adapter;
- automatic Glade/Sunbeam Village gateways use the shared registry/coordinator path and preserve destination spawn behaviour;
- interaction priority prevents Cottage Garden from stealing Pip's Talk action;
- browser tests now distinguish first-time Pip onboarding from later explicit Talk behaviour;
- Juniper/supporting-resident dialogue tests assert the shared production portrait behaviour rather than retired fallback geometry;
- touch/tablet tests exercise the complete authored welcome sequence and current canonical movement controls.

## Source fix that motivated the audit

The stubborn pink flower behind the Old Garden Gate sign was traced to:

`EnvironmentProductionPresentationManager -> createMoonflowerGladeProduction -> addStorybookFlower(... 270, 760 ...)`

It lived inside a signature container at `(0,0)`, which is why earlier top-level coordinate cleanup could not identify it reliably.

The production flower call was removed at source and the spatial cleanup workaround was subsequently removed.

## Reusable standards extracted

See `docs/engineering/H1-WORLD-IMPLEMENTATION-CONVENTIONS.md`.

The key rules are:

- one canonical owner for one visible feature;
- stable ids/names/map data rather than coordinate hunting;
- shared registry/coordinator for production world interactions;
- physical collectables use explicit shared `Pick up` semantics;
- shared dialogue/feedback ownership and priority;
- bounded lifecycle work, no perpetual suppression scans;
- semantic collision/hook data for physical props and future systems;
- tests follow final approved contracts, not intermediate patches.

## Intentionally retained compatibility outside H1

This audit is not a speculative whole-game rewrite. The following older patterns remain because they belong to other regions/packages and changing them here would increase H1 regression risk:

- `CoreSceneInteractionBridge` still captures legacy activators for Sunbeam Village and Rainbow Meadow;
- core NPC production still has prototype-suppression compatibility for Village/Nova/Lumi where their source-region migrations are not part of H1;
- other R5/R6 generic tightening/presentation managers continue to support their non-Glade scenes.

These are now documented debt rather than hidden H1 dependencies. Future region passes should remove their own compatibility layer at source using the same pattern established here.

## Qualification result

H1.11 runtime qualification is complete. The consolidated runtime head passed the full engineering and browser matrix, and David explicitly approved merge/deployment. The remaining pre-merge work is repository bookkeeping plus selected verification of the documentation-only completion commits; no further H1 runtime remediation is required.