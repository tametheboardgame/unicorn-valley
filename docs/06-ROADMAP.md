# Unicorn Valley - Development Roadmap

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
8. let real child playtesting decide what receives the most expansion.

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
- browser compatibility testing.

Playable result:

- the project feels like a real small game rather than a development build.

### R7 - Daughter-led Expansion

**Outcome:** roadmap priority changes from assumptions to observed preferences.

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

- Starlight Beach;
- larger secret chains;
- creature discoveries;
- Cloudtop Peaks.

If companion play dominates:

- more eggs/creatures;
- companion following;
- companion customisation;
- companion mini-games.

The objective is to expand the game she actually demonstrates that she wants, not the one adults predicted.

## Future releases not yet scheduled

These are deliberately beyond the committed roadmap until earlier playtests justify them.

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

### Baking/cooking

- simple ingredient choices;
- visual decorating;
- picnic/event integration.

### Companion expansion

- multiple companion species;
- home interaction;
- following behaviour;
- discovery chains.

### Starlight Beach

- beach region;
- shell/tide-pool collecting;
- sand activities;
- beach race.

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

## Expansion rule

Any proposed feature should answer:

- Which design pillar does it strengthen?
- What does the child get to *do* that she cannot do now?
- Does it create new content opportunities or only new complexity?
- Can it be implemented as a reusable system?
- Does it add pressure, grind or maintenance behaviour that contradicts the game vision?

Features that do not pass this test remain backlog ideas rather than roadmap commitments.
