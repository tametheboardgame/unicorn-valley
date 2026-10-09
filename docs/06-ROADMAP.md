# Unicorn Valley - Development Roadmap

## 2026-10-09 R6.5-WP19SH1.8 The Lantern at the Edge of the Woods started

**SH1.6.3 - The Tale of Jemima Puddle-Duck is complete, human-approved and merged via PR #297**
as `03ca6a9866424ba575de56b6c6e526fac001a755`.

The next Story House title is **SH1.8 - The Lantern at the Edge of the Woods**, original Valley
fiction by Quill. Source audit: 4 chapters, 12 stable blocks, no existing cover and no existing
illustrations. It remains a single original Story House edition; no artificial Classic illustration
experience will be created.

SH1.8A is active. The five continuity gates are Rowan, game-accurate Quill, the hill village and edge
lantern, the moving woodland path/glowmoths, and the quiet clearing/mirror lantern. After approval,
reader generation proceeds in four three-image chapter batches. Final cover selection will reuse the
strongest approved reader image under the canonical cover rule.

Detailed plan:
`docs/story-house/visual-bibles/the-lantern-at-the-edge-of-the-woods.md`.

## 2026-10-09 R6.5-WP19SH1.6.3 full Jemima image set integrated

The complete 11-image modern reader set for **The Tale of Jemima Puddle-Duck** is human-approved,
locked and materialised through the R4 Drive → WIF → GitHub Actions pipeline.

SH1.6.3B, C and D are complete. SH1.6.3E is active with the book integration now wired:

- the four existing Story House Potter images are preserved as **Classic Illustrations**;
- the 11 approved generated images are the default **Modern Illustrations** set;
- the separate 10-page Full Classic Text and all 25 historic Potter illustrations are untouched;
- **Four Ducklings** is reused directly as the Modern cover;
- the Story House UI supplies the title overlay;
- the normal centred 3:4 catalogue crop is acceptable, so no special cover-position CSS is needed.

Next gate: focused CI/Cloudflare preview and final human review before PR #297 is taken out of draft
and merged.

## 2026-10-08 R6.5-WP19SH1.6.3B Chapters 1–2 locked

**SH1.6.3A is complete and human-approved.** The five continuity anchors for Jemima, the
sandy-whiskered fox, Kep, the farm/cart road and the woodland clearing/feather shed are locked.

**SH1.6.3B is also complete and human-approved.** The first four modern reader illustrations are
locked at 1536 × 1024:

1. The Farmyard Problem — `a-farmyard-problem`
2. Off to the Secret Wood — `a-quiet-nest`
3. The Sandy-whiskered Gentleman — `the-sandy-whiskered-gentleman`
4. The Feather Shed — `the-feather-shed`

The final Gentleman composition uses the newspaper resting naturally on the mossy stump; earlier
awkward newspaper versions are rejected. These four images must not be regenerated unless David
explicitly reopens them.

**Next: SH1.6.3C — Chapters 3–4, images 5–8.**

## 2026-10-08 R6.5-WP19SH1.6.3 Jemima Puddle-Duck started

**SH1.6.2 - The Tale of Peter Rabbit is complete, human-approved and merged via PR #295.**
The finished Story House edition has 11 approved modern reader illustrations, independent Classic /
Modern illustration selection and a modern cover that reuses the approved Under the Gate reader
image. The 10-page Full Classic Text and all 26 historic Potter illustrations remain intact.

**SH1.6.3 - The Tale of Jemima Puddle-Duck is now active at SH1.6.3A.** The source audit confirms a
five-chapter Story House retelling with 11 stable content blocks and four existing Potter
illustrations, plus a separate 10-page Full Classic Text containing all 25 historic Potter narrative
illustrations. The modern plan is 11 reader images, one per stable Story House block.

Before bulk generation, five continuity anchors must be human-approved: Jemima, the
sandy-whiskered fox, Kep, the farm/cart-road environment and the woodland clearing/feather shed.
Generation then proceeds in bounded batches: Chapters 1–2 (images 1–4), Chapters 3–4 (images 5–8),
Chapter 5 (images 9–11), followed by integration, modern-cover selection from approved reader art,
Cloudflare review and closeout.

Detailed plan:
`docs/story-house/visual-bibles/the-tale-of-jemima-puddle-duck.md`.

Authoritative programme detail:
`docs/work-packages/R6.5-WP19SH1-STORY-HOUSE-ILLUSTRATED-CLASSICS.md`.

## 2026-10-08 Story House modern cover convention locked

The Story House modern-cover rule is now canonical: **reuse an already approved modern reader
illustration as the modern catalogue cover**. Do not generate a second cover-only image, duplicate
the reader asset, or bake the book title into the artwork. The Story House library supplies the
shared title overlay automatically.

`book.json` should point the `modern` entry in `coverSets` directly at the selected reader WebP.
The normal catalogue presentation uses `object-fit: cover` with a centred crop. Add a minimal
story-specific `object-position` adjustment only when human preview shows that the focal subject
needs repositioning.

The canonical operational instructions live in
`docs/story-house/GENERATED-ASSET-PIPELINE.md` and
`docs/story-house/GENERATED-ASSET-RUNBOOK.md`. Alice and Peter Rabbit are the reference
implementations.

## 2026-10-06 R6.5-WP19SH1.6 dual-edition illustration sequence advanced

**SH1.6.1 - Alice's Adventures in Wonderland is complete, human-approved and merged via PR #291.**
The finished Story House edition now has 36 approved modern illustrations, independent Classic /
Modern illustration selection and the approved White Rabbit modern cover treatment while preserving
the historic/classic material.

**SH1.6.2 - The Tale of Peter Rabbit was then active at SH1.6.2A.** Its five-chapter audit produced
the 11-image reader plan and continuity gate that were subsequently completed and merged on
8 October 2026. The 10-page Full Classic Text and all 26 historic Beatrix Potter illustrations were
preserved.

The next title in the sequence was **SH1.6.3 - The Tale of Jemima Puddle-Duck**, preserving its 25
historic Full Classic illustrations.

Authoritative detail:
`docs/work-packages/R6.5-WP19SH1-STORY-HOUSE-ILLUSTRATED-CLASSICS.md`.

## 2026-09-28 R6.5-WP19SH1 Story House illustrated classics parallel stream planned

A separate Story House content stream is now planned alongside the main H3.11.5+ world/interior
work. It starts once R6.5-WP19H3.11-R4 is accepted and uses the permanent generated-asset pipeline
to reillustrate selected existing classics with ChatGPT-generated artwork.

The stream is deliberately parallel-safe when confined to Story House content, generated-asset
manifests and Story House documentation. The initial sequence is:

1. **SH1.1 - Foundation and current-content audit**
2. **SH1.2 - The Lion and the Mouse generated-art pilot**
3. **SH1.3 - Quick-read classics batch**
4. **SH1.4 - Mid-length fairy-tale batch**
5. **SH1.5 - Long-form classic retellings**
6. **SH1.6 - Dual-edition generated reillustration for Alice/Peter Rabbit/Jemima**
7. **SH1.7 - Classics programme consolidation**

Historic/public-domain illustration sets remain preserved. Generated assets live separately under
`public/stories/<story-id>/illustrations/generated/`.

Authoritative roadmap:
`docs/work-packages/R6.5-WP19SH1-STORY-HOUSE-ILLUSTRATED-CLASSICS.md`.

## 2026-09-28 R6.5-WP19H3.11-R4 generated asset pipeline started

R3.1-R3.5 are complete. R4 is now the active mandatory prerequisite before H3.11.5 Rosehip Cottage.

The target asset path is **ChatGPT image generation → Unicorn Valley / Generated Asset Staging in Google Drive → GitHub Actions → generated WebP on a development branch → Cloudflare preview**.

The R4 development branch now contains:

- a dedicated Drive staging folder and repository-side staging-folder policy;
- a reusable Drive image materialiser with parent-folder, MIME, source-size, output-size and destination-root validation;
- deterministic WebP resize/compression;
- a reusable GitHub Actions workflow that commits generated assets only to an existing development branch, never directly to `main`;
- a small JSON manifest contract with revision-driven replacement support;
- a disposable Cloudflare smoke page for the two-pass acceptance test.

The R4 acceptance proof is complete: GitHub OIDC/WIF authentication succeeded, a staged generated image was materialised and deployed, the same Drive file ID was replaced in place, the replacement was materialised and deployed, and the disposable smoke material was cleaned up. Permanent pipeline/runbook documentation is committed on the R4 branch.

## 2026-09-27 R6.5-WP19H3.11-R3 inserted before Rosehip Cottage

H3.11-R2 Wobbly Cake is **complete and human-approved** and PR #183 merged it to `main` on 27 September 2026 as `abe3808b76031c67a74811b17c4b6528b0b331df`.

The post-R2 human play pass identified a cross-cutting remediation block that must be completed before H3.11.5 Rosehip Cottage. The approved order is:

1. **H3.11-R3.1 - Interaction-aware click navigation and dialogue movement lock** — distant NPC click-to-talk intent, collision-safe stand-off navigation, and no click movement while conversation/interaction modals are open.
2. **H3.11-R3.2 - Exploration surface lifecycle hardening** — one reliable Bag/Map/Book/Settings pause/resume/close ownership contract across outdoor scenes and walkable interiors/shops, with repeated lifecycle regression coverage.
3. **H3.11-R3.3 - Pip startup and music resume continuity** — no initial Pip flash before introduction state resolves; tab/browser return resumes the same music track from its prior playback position.
4. **H3.11-R3.4 - Mobile performance and movement consistency** — measure and remove avoidable high-frequency scene work, make movement response robust under lower frame rates, and validate walk/Gallop consistency on smaller-device profiles.
5. **H3.11-R3.5 - Glade/Village visual tightening** — remove the Moonflower Glade→Sunbeam decorative arch, connect Sunbeam paths to shop doors, and anchor high-street bunting roof-corner to roof-corner.

R3 is a bounded insert and does **not** renumber H3.11.5-H3.11.10. R3.1-R3.5 are now complete and human-approved. Before work resumes at **H3.11.5 Rosehip Cottage**, the mandatory **H3.11-R4 Generated asset staging and GitHub materialisation pipeline** acceptance gate must be completed.

**R3.4 history correction (28 September 2026):** PR #203, merged as `34286d9`, was titled as an R3.3 performance investigation because of a numbering collision. Its approved hotspot work is actually the main R3.4 performance implementation. Do not repeat that audit. The remaining R3.4 closeout is limited to elapsed-time movement response, the remaining presentation-scan cleanup, and explicit phone/tablet walk/Gallop/performance regression evidence.

## 2026-09-26 R6.5-WP19H3.11.4 Story House complete

H3.11.4 A-F is **complete and human-approved**. The accepted Story House baseline now includes a polished walkable library with Quill, content-driven long-form story packages, a responsive DOM reader, durable independent reading progress/preferences, demand-loaded illustrations, paged picture-book support, scalable metadata/search/filter discovery, compact catalogue surfaces and direct tap/swipe page turns.

The approved head `82dec6e91305d9eed962da46c8af52873a0e98a5` passed CI #4010 and PR #181 merged to `main` as `52069b8e36311e14276c2115f3515dfa52f2adb0`. H3.11-R1 Bakery/Picnic remediation is also closed. The next bounded slice is **H3.11-R2 - Wobbly Cake baking mini-game**, followed by H3.11.5 Rosehip Cottage.

See `docs/audits/2026-09-26-H3.11.4-STORY-HOUSE-CLOSEOUT.md` and `docs/work-packages/R6.5-WP19H3-SUNBEAM-VILLAGE.md`.


## 2026-09-15 R6.5-WP19H1 complete - Moonflower Glade final polish and hardening

`R6.5-WP19H1 - Moonflower Glade Final Polish` is complete and human-approved. H1.1-H1.10 delivered the intended visual, interaction and world-authorship result through iterative review; H1.11 then consolidated the implementation, removed legacy suppression/workarounds and established reusable conventions before final qualification.

Final H1 outcomes include:

- Moonflower Glade spatial composition, cottage/front garden, Home Meadow, environmental boundaries and Moonflower Field were rebuilt/polished into a coherent home region;
- Moonflower Field is integrated directly into the Glade and its special Moonflowers use the canonical explicit `Pick up` interaction;
- stream/reeds/fish, physical signage, garden plots, Pip presentation, dialogue, feedback and interaction ownership were consolidated behind canonical systems;
- player/supporting-resident clipping and portrait issues were corrected at shared art/presentation owners;
- transient guidance/reward/dialogue ownership and quest-completion sequencing were standardised;
- automatic Glade/Sunbeam Village traversal, interaction priority and movement-input ownership regressions exposed during consolidation were fixed without restoring retired Glade-local systems;
- obsolete Moonflower Patch/runtime entry paths, prototype Pip/local interaction/dialogue ownership and create-then-hide Glade presentation were retired where safe;
- `docs/audits/2026-09-15-H1-CONSOLIDATION-AUDIT.md` records the final ownership audit;
- `docs/engineering/H1-WORLD-IMPLEMENTATION-CONVENTIONS.md` records the reusable world implementation rules for later areas.

The final qualified runtime head before documentation-only completion commits was `8dff0c5f9bd1c49212b5cb9d14d177d32483587f`. Formatting, lint, architecture, verification/performance policy, type-check, unit contracts, production build, static smoke, performance architecture, all three full Chromium shards and the Firefox/WebKit/Chromium compatibility matrix passed. David explicitly authorised final documentation, merge and deployment on 15 September 2026. Documentation-only completion commits are separately verified before merge.

H1 is closed. The next area review, if started, becomes `R6.5-WP19H2`; it must not be treated as unfinished H1 work.

## 2026-09-15 R6.5-WP19H1.11 consolidation, cleanup and hardening

H1.11 is **complete and human-approved**. The authoritative record is `docs/work-packages/R6.5-WP19H1.11-CONSOLIDATION-CLEANUP-HARDENING.md` and the detailed findings are in `docs/audits/2026-09-15-H1-CONSOLIDATION-AUDIT.md`.

Completed outcomes:

- audited H1.1-H1.10 for legacy presentation created and later hidden/destroyed/repositioned;
- traced suppression/workaround code back to source owners and removed obsolete source behaviour instead of maintaining cleanup hacks;
- established canonical ownership for Glade paths, signs, gardens, field/stream presentation, NPC art, interaction presentation, dialogue and transient feedback;
- retired superseded Glade/Moonflower Patch/scene-local interaction remnants where they were no longer production dependencies;
- standardised reusable patterns for later regions, including explicit pickups, interaction registry/coordinator ownership, dialogue/feedback ownership, semantic map geometry and lifecycle cleanup;
- reduced avoidable high-frequency scene scans and tightened manager teardown/lifecycle behaviour;
- sanity-checked H1 save/discovery/inventory/quest progression and sequencing;
- updated stale browser expectations to protect final approved behaviour rather than intermediate implementations;
- documented H1 implementation conventions for future region work;
- passed full Chromium and cross-browser qualification.

The Old Garden Gate flower issue became the reference failure mode for this pass: the final fix removed the exact source decoration from `EnvironmentProductionPresentationManager`, after which the compensating spatial cleanup was removed.

## 2026-09-15 R6.5-WP19H1.10 final Glade polish checkpoint

H1.10 is **complete and human-approved**. The authoritative brief/result is `docs/work-packages/R6.5-WP19H1.10-COTTAGE-GARDEN-SIGNAGE-FIELD-POLISH.md`.

Delivered outcomes:

- player-unicorn tail clipping corrected at the shared player-art/presentation owner;
- Old Garden Gate and Sunbeam Village labels replaced with physical world signs and aligned post/base collision;
- three stable future-ready garden plots established with one shared interaction point each;
- the stream-bank plot aligned with the upper/main garden envelope and conflicting reeds removed;
- garden-edge tree positions authored correctly at source;
- the right-edge blue flower layering corrected and the tree-overlapping pink field flower removed;
- the separate Old Garden Gate background flower traced to its production decoration source and removed there rather than suppressed later.

The accepted H1.10 appearance/gameplay became the parity baseline for H1.11 consolidation.

## 2026-09-15 R6.5-WP19H1.9 remediation checkpoint

H1.9 is **complete and human-approved** following David's deployed tablet review. The authoritative record is `docs/work-packages/R6.5-WP19H1.9-INTERACTION-FEEDBACK-DIALOGUE-REMEDIATION.md`.

Delivered outcomes include:

- the first green sparkle now uses the shared explicit `Pick up` interaction and hands off to one blue return-to-Pip guidance card;
- physical H1 collectables use the shared explicit pickup language rather than proximity auto-collection, with persistent object labels removed;
- shared transient-notification ownership prevents guidance, Wonderbook/reward feedback and dialogue from stacking over one another;
- Pip's closing trail conversation now completes first and the centred `Quest Complete` presentation appears only after dialogue closes;
- ordinary dialogue geometry is stable through Continue/Done progression and supporting-resident portrait framing was corrected at the shared owner;
- the blue guidance star has a dedicated gutter and no longer overlaps leading message text;
- shared camera/presentation jitter mitigations were applied without snapping deliberately smooth NPC/fish/world animation.

The H1.9 visual gate is closed and its approved behaviour is now part of the completed H1 baseline.

## 2026-09-08 approved remediation plan

WP19B was human-approved and merged as `c2d98ae` on 9 September 2026; its merge-SHA-bound production smoke passed in Actions `34356744951`. WP19C is now active on its draft branch and remains behind its separate visual gate. David’s mild observation that some places appear to have two path layers is deferred unchanged to the final graphics-specific pass, not WP19C.

David approved the whole-game audit remediation plan on 2026-09-08. Read `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md` and `docs/2026-09-08-REMEDIATION-PROPOSAL.md` first. Approved next order: WP19A persistence safety → WP18K foundation → WP19B boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F consistent UI/generated title → WP19G/H audio → WP19I qualification → WP18H daughter replay → WP17 readiness. Independent preparation is described in the proposal.

This approves the work programme, not completion of its implementation. Existing delivery history below is preserved. R7 and production release remain gated. This plan supersedes the previous direct WP18K→WP18H sequence.


## Roadmap philosophy

Development is organised into releases and small work packages rather than attempting to build the full life simulator at once.

Each release must leave the project in a coherent, playable state. A later release may deepen systems, but should not depend on throwing away earlier foundations.

The sequence deliberately prioritises:

1. prove the basic browser/game stack;
2. prove that controlling and customising a unicorn feels good;
3. prove that the world can remember player actions;
4. prove that the cottage/expression loop is engaging;
5. add racing as the first deep repeatable activity;
6. add content breadth;
7. replace prototype presentation with increasingly polished art/audio;
8. fill the polished systems with enough places, characters, quests, shops and activities to make the valley feel like a complete small game;
9. let real child playtesting decide what receives the most expansion only after the available choices are mature enough to compare fairly.

## Release overview

### R0 - Foundation and Pre-production

**Outcome:** repository contains the design baseline and a deployable game skeleton with stable architectural foundations.

Key outcomes:

- Phaser + TypeScript + Vite project scaffold;
- Cloudflare-compatible static build;
- basic automated quality checks;
- scene framework;
- typed game-state structure;
- versioned local save framework;
- input abstraction;
- content ID conventions;
- placeholder asset pipeline.

Playable result:

- browser opens a branded title/boot experience and can enter a placeholder game scene.

This release is intentionally visually crude.

### R1 - My Unicorn: First Playable

**Outcome:** the player can create a unicorn, enter Moonflower Glade, move around, interact, meet Pip and return later to the same saved unicorn.

Key systems:

- character creator v1;
- player entity;
- movement/collision/camera;
- basic interaction system;
- dialogue cards;
- first collectable;
- Pip introduction;
- Wonderbook shell;
- automatic save/resume.

Playable result:

- a complete five-to-ten-minute introductory toy that demonstrates "this is my unicorn in my world".

### R2 - Living Valley Vertical Slice

**Outcome:** the game demonstrates the complete emotional loop: explore, help someone, collect something, earn a reward, decorate the cottage and see the world remember.

Key systems/content:

- Sunbeam Village;
- first full NPC set subset;
- item/inventory system;
- quest engine;
- relationship state;
- Willow's Moonflowers quest;
- persistent garden change;
- cottage interior;
- decorating v1;
- first cosmetic/decoration rewards;
- first-pass sound and UI identity;
- optional activity suggestions;
- pre-playtest visual polish and UX correction pass;
- daughter playtest and recovery pass.

Playable result:

- a coherent vertical slice polished enough that the first child playtest measures enjoyment and comprehension rather than obvious prototype defects.

**Pre-playtest gate:** R2-WP2.10A removes obvious visual defects, improves the procedural unicorn and creator presentation, aligns world visuals with navigation/collision, and clarifies suggestion/HUD behaviour before the first daughter playtest.

**Major decision gate:** R2-WP2.10B then observes what the player naturally spends time doing before over-investing in later systems.

### R3 - Rainbow Run Racing

**Outcome:** racing becomes a polished repeatable activity inside the life-sim world.

Key systems/content:

- Rainbow Meadow expansion;
- Rainbow Run hub;
- dedicated race scene;
- jumping and obstacle logic;
- NPC racers;
- boosts/collectables;
- results and personal bests;
- participation rewards;
- ribbons;
- Nova's introductory story;
- race assistance option;
- first named cup.

Playable result:

- the player can leave home, visit Nova, enter races, earn rewards and use those rewards elsewhere in the life-sim.

### R4 - Friendship, Secrets and Home Depth

**Outcome:** the game begins to feel like a persistent place rather than a sequence of demos.

Key systems/content:

- broader friendship progression;
- Pip's strange egg arc;
- Marigold picnic/event story;
- Pebble discovery content;
- shop/currency v1;
- multiple decoration sets;
- expanded Wonderbook;
- more secrets;
- more conditional NPC dialogue;
- visible state changes across existing areas;
- optional home visits by friends.

Playable result:

- several sessions can produce visibly different world and home states.

### R5 - The Valley Gets Bigger

**Outcome:** exploration becomes a major reason to return.

Key systems/content:

- Crystal Brook;
- Whispering Woods;
- new collectable families;
- first non-racing mini-game;
- environmental discovery system expansion;
- gentle day/time visual states;
- special weather/magical ambience states;
- hidden routes;
- Lumi story content;
- additional race course using a different region.

Playable result:

- the player has multiple distinct places and activity types to choose between in a session.

### R6 - Production Presentation and Accessibility

**Outcome:** replace obvious prototype quality with a cohesive child-facing game presentation.

Key work:

- production-quality modular player unicorn art;
- finalised core NPC designs;
- coherent environment art pass;
- animation pass;
- polished UI skin;
- Wonderbook art pass;
- region music;
- sound-effects pass;
- touch control refinement;
- race assistance refinement;
- reduced-motion support;
- loading/performance optimisation;
- save migration hardening;
- browser compatibility testing;
- human mobile playthrough remediation through R6-WP6.18.

Playable result:

- the project feels like a real small game rather than a development build.

R6 proves presentation and usability, but the final human playthrough established that content breadth is still too limited for a fair preference-led R7 decision.

### R6.5 - Valley Completeness and Breadth

**Outcome:** populate the polished game with enough places, unicorns, interactions, quests, shopping, races, activities and revisit content that free play becomes genuinely open-ended.

R6.5 is a mandatory release inserted before R7. It exists because preference-led expansion is only useful when the player is choosing between sufficiently mature alternatives. A child repeatedly choosing the most complete current system is not yet reliable evidence that it is her favourite long-term fantasy.

Key work:

- audit the complete existing content set and establish measurable density targets;
- give every current major region its own content-depth pass;
- make Moonflower Glade and Cottage richer, more personal and more interactive;
- turn Sunbeam Village into a busy social/shopping hub with useful interiors;
- make Rainbow Meadow and Rainbow Run worthwhile outside race entry;
- turn Crystal Brook into a dense exploration destination rather than a corridor;
- deepen Whispering Woods with mysteries, residents, secrets and revisit content;
- add reusable supporting-unicorn/ambient-life patterns and 8-10 recurring supporting residents;
- add many small child-readable environmental interactions across all regions;
- complete the economy/reward loop so shopping has purpose without grind;
- ensure the Bakery, Twinkle & Thread and Story House each have a repeat-use reason to enter;
- raise the game to at least 12 meaningful quest/story threads in total, with substantial new R6.5 content and core-character follow-ups;
- grow racing to five distinct course experiences and add a friendly Rainbow Cup/championship structure;
- add at least two new repeatable non-racing activities alongside Firefly Lantern;
- promote **Starlight Beach** from future backlog into a full production region with residents, quests, secrets, collection content, an activity and a beach race;
- expand the Wonderbook so the broader world, characters, places, secrets, ribbons and collections remain legible;
- perform a final global content/tidy-up/mobile/performance pass;
- run a full human playthrough whose question is "Is there now enough meaningful choice for preference-led observation?"

Content-density principles:

- every major outdoor region should repeatedly reward curiosity;
- no large area should feel like several screens of travel between isolated quest markers;
- each main region should contain optional interactions, secrets, quest use, revisit value and visible/reactive state;
- new unicorn residents should have distinct identities and changing dialogue, not exist as static crowd props;
- beautiful facades and landmarks should either be usable or clearly decorative rather than falsely promising missing content;
- new quests should use varied verbs rather than becoming a collection of reskinned fetch errands;
- rewards should feed naturally into shopping, customisation, home display, collections and further play.

Playable result:

- several sessions can be spent choosing among exploration, quests, shopping, customisation, decorating, racing, collecting, secrets, NPC stories and non-racing activities without one option dominating simply because the others lack content.

**Hard gate:** R7-WP7.1 may not begin until R6.5-WP17 confirms through human play that the valley is broad enough for daughter-led preference evidence to be meaningful.

Detailed scope, quantitative targets and all 17 work packages are authoritative in `07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`.

### R7 - Daughter-led Expansion

**Outcome:** roadmap priority changes from assumptions to observed preferences, but only after R6.5 establishes credible breadth across the available play fantasies.

This release is intentionally not fully predetermined.

Potential branches depend on play behaviour:

If customisation dominates:

- deeper wardrobe;
- themed outfits;
- more mane/tail/horn choices;
- saved looks;
- magical visual effects.

If cottage play dominates:

- extra room;
- garden;
- more decoration freedom;
- interactive furniture;
- friend visits.

If racing dominates:

- multiple cups;
- route choices;
- new race regions;
- flying races;
- championship structure.

If exploration dominates:

- larger secret chains;
- creature discoveries;
- Cloudtop Peaks;
- other new regions justified by observed play.

If companion play dominates:

- more eggs/creatures;
- companion following;
- companion customisation;
- companion mini-games.

The objective is to expand the game she actually demonstrates that she wants, not the one adults predicted. R6.5 exists so that demonstration is based on real choice rather than uneven content availability.

## Future releases not yet scheduled

These remain deliberately beyond the committed roadmap until later playtests justify them. Starlight Beach is no longer in this section because it has been promoted into committed R6.5 scope.

### Flight / Cloudtop Peaks

- unlockable wings;
- flying movement/activity;
- cloud region;
- flying races;
- airborne collectables.

### Gardening

- magical seeds;
- garden layout;
- non-punitive growth;
- creature attraction;
- decorative harvests.

### Baking/cooking expansion

R6.5 may introduce a small Marigold baking/decorating activity. A deeper cooking system remains future scope.

Potential later work:

- broader ingredient choices;
- recipe/discovery depth;
- larger visual decorating system;
- picnic/event integration.

### Companion expansion

- multiple companion species;
- home interaction;
- following behaviour;
- discovery chains.

### Further regions

Potential later regions include:

- Lantern Marsh;
- Frostbell Vale;
- additional beach/sea spaces if Starlight Beach proves popular;
- other daughter-led region concepts.

### Seasonal-style festivals

Events should remain available through progression/selection rather than real-world FOMO.

## Release gates

A release is not complete merely because all planned code exists.

Each release should satisfy four gates.

### Functional gate

- planned mechanics work;
- major flows are completable;
- saves reload correctly;
- no known progression blockers.

### Technical gate

- production build succeeds;
- automated tests pass where present;
- TypeScript/lint checks pass;
- no major console errors;
- save schema is versioned/migrated correctly.

### Child-UX gate

- controls and exits are understandable;
- no essential instruction depends on large amounts of reading;
- errors are recoverable;
- feedback is visible;
- target player can progress with minimal adult intervention.

### Deployment gate

- static production build deploys;
- main branch remains releasable;
- asset paths work in hosted environment;
- save/reload works on deployed build.

## Vertical-slice gate after R2

R2 is the most important early checkpoint.

Before expanding aggressively, answer through observation:

- Does she enjoy controlling the unicorn?
- Does she revisit customisation?
- Does she understand the interaction language?
- Does she remember and seek out NPCs?
- Does the visible garden/world change register emotionally?
- Does she voluntarily decorate the cottage?
- Does she explore without being told to?
- What does she ask to do that is not implemented?

Problems discovered here should be fixed before R3/R4 scope expands.

## Pre-preference breadth gate after R6

The final R6 playthrough proved the game was usable and polished enough to continue, but also established a new design lesson: preference-led expansion is not valid while some play fantasies remain significantly under-populated.

R6.5 therefore comes before the R7 preference review.

Before R7, answer through R6.5-WP17:

- Are there enough distinct places to explore?
- Does every existing place contain enough detail, residents and interaction?
- Are shopping and earning rewards real play loops?
- Are there enough quests to choose questing voluntarily?
- Are there enough races to judge racing rather than one favourite track?
- Are there several repeatable non-racing activities?
- Do supporting unicorns make the valley feel socially alive?
- Do old places change and reward return visits?
- Can the child choose among mature-enough alternatives without adult prompting?

Only then should R7 ask which fantasy deserves disproportionate expansion.

## Development order rule

Within a release, build dependencies before content that uses them.

Example:

1. Quest state model.
2. Quest engine.
3. Content validation.
4. One tiny test quest.
5. Willow's production quest.
6. Persistence variant.
7. polish.

Do not build three bespoke quests and then infer a quest architecture from them.

## Art order rule

Use placeholders until the relevant mechanic is stable.

Production art should follow proven interaction, with the exception of limited concept art needed to establish visual language.

For R6.5, existing production art systems should be reused aggressively for supporting residents and content variants. New hero-grade art should be reserved for places/characters where it materially improves the game rather than becoming a bottleneck to content density.

## Expansion rule

Any proposed feature should answer:

- Which design pillar does it strengthen?
- What does the child get to *do* that she cannot do now?
- Does it create new content opportunities or only new complexity?
- Can it be implemented as a reusable system?
- Does it add pressure, grind or maintenance behaviour that contradicts the game vision?

Features that do not pass this test remain backlog ideas rather than roadmap commitments.