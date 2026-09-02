# Unicorn Valley - Work Packages

## Purpose

This file converts the roadmap into bounded implementation units suitable for sequential agent-led development.

A work package should normally:

- have one primary outcome;
- leave the repository buildable;
- include its own validation;
- avoid mixing unrelated systems;
- be small enough to review and diagnose independently;
- state dependencies explicitly.

Work package IDs are stable. If scope changes, update the description rather than silently reusing an ID for different work.

---

# R0 - Foundation and Pre-production

## R0-WP0.1 - Design Baseline

Status: **Complete in planning pass**

Goal:

- establish the game vision, systems, world, UX, art direction, architecture and roadmap as repository source-of-truth documentation.

Deliverables:

- game vision;
- core systems design;
- world/character design;
- technical architecture;
- child UX/safety principles;
- art/audio direction;
- roadmap;
- work-package register.

Acceptance:

- later implementation packages can reference stable design decisions rather than relying on chat history.

## R0-WP0.2 - Phaser/Vite/TypeScript Scaffold

Dependencies: R0-WP0.1

Goal:

- create the minimum real game project.

Deliverables:

- package configuration;
- TypeScript configuration;
- Vite configuration;
- Phaser game configuration;
- `BootScene`, `PreloadScene`, `TitleScene` placeholders;
- development and production scripts;
- basic `.gitignore`;
- placeholder favicon/page metadata.

Acceptance:

- `npm install` succeeds;
- `npm run dev` launches the game;
- `npm run build` produces static output in `dist`;
- title screen renders without console errors.

## R0-WP0.3 - Quality Gates and Repository Hygiene

Dependencies: R0-WP0.2

Goal:

- make build correctness automatic before gameplay complexity grows.

Deliverables:

- linting;
- formatting policy;
- unit-test runner;
- type-check script;
- combined validation script;
- GitHub Actions CI for install/typecheck/test/build where practical;
- contribution/development notes for future agent runs.

Acceptance:

- intentionally broken TypeScript fails validation;
- normal branch passes validation;
- production build is exercised in CI.

## R0-WP0.4 - Core State, Save and Event Foundations

Dependencies: R0-WP0.2

Goal:

- establish the durable internal backbone before gameplay state appears in scenes.

Deliverables:

- typed root `SaveGame` model;
- schema version constant;
- default new-game factory;
- local save repository;
- save service;
- migration framework;
- typed event bus or equivalent event contract;
- unit tests for new save/load/migration behaviour.

Acceptance:

- new save can be created, stored and reloaded;
- malformed/missing data fails safely;
- schema version is explicit;
- game scenes do not directly call raw `localStorage`.

## R0-WP0.5 - Input Abstraction and Responsive Canvas

Dependencies: R0-WP0.2

Goal:

- prevent gameplay from binding itself directly to keyboard controls.

Deliverables:

- input action definitions;
- keyboard input adapter;
- initial pointer/touch adapter shell;
- resolution/scaling configuration;
- safe UI bounds helper;
- basic resize test page/scene.

Acceptance:

- scenes consume named actions;
- canvas scales without distorting the logical game world;
- keyboard controls continue working across resize.

## R0-WP0.6 - Content Registry and Validation Skeleton

Dependencies: R0-WP0.3, R0-WP0.4

Goal:

- create stable data-driven content conventions.

Deliverables:

- stable ID conventions;
- typed registries for items, characters, quests and discoveries;
- small placeholder data sets;
- validation for duplicate/missing IDs;
- tests proving invalid references are caught.

Acceptance:

- adding a bad content reference causes validation failure rather than a silent runtime bug.

## R0-WP0.7 - Cloudflare Deployment Smoke Build

Dependencies: R0-WP0.2, R0-WP0.3

Goal:

- prove the static build is hosting-ready before significant content exists.

Deliverables:

- documented Cloudflare Pages settings;
- production asset-path verification;
- deployment smoke checklist;
- any Vite base-path/config changes required for Pages.

Acceptance:

- production build can be hosted as static files;
- refresh and asset loading work in deployed environment;
- `main` remains suitable as production branch.

---

# R1 - My Unicorn: First Playable

## R1-WP1.1 - Player Entity and Basic Movement

Dependencies: R0-WP0.5

Goal:

- control a placeholder unicorn in a simple world scene.

Deliverables:

- player entity/component;
- movement controller;
- directional facing;
- basic collision body;
- camera follow;
- placeholder idle/movement animation states.

Acceptance:

- player can move smoothly with keyboard;
- player cannot leave intended test boundaries;
- camera behaviour is comfortable and stable.

## R1-WP1.2 - Moonflower Glade Prototype Map

Dependencies: R1-WP1.1

Goal:

- create the first explorable home region using prototype art.

Deliverables:

- Moonflower Glade layout;
- collision map;
- cottage exterior;
- bridge/stream/flower landmarks;
- entrance points reserved for later connections;
- foreground layering test.

Acceptance:

- map is fully traversable;
- no collision traps;
- major landmarks are visually distinguishable even with placeholder art.

## R1-WP1.3 - Interaction Framework

Dependencies: R1-WP1.1

Goal:

- provide one consistent way to interact with NPCs, objects, doors and discoveries.

Deliverables:

- interactable contract;
- nearest-valid-target selection;
- interaction icon/prompt;
- input action integration;
- sample inspectable object;
- sample doorway transition stub.

Acceptance:

- prompt appears only in sensible range;
- correct target is selected when objects are near each other;
- keyboard and pointer/touch path can invoke the same action API.

## R1-WP1.4 - Dialogue Framework

Dependencies: R0-WP0.6, R1-WP1.3

Goal:

- support child-friendly NPC conversation.

Deliverables:

- dialogue data model;
- dialogue card UI;
- continue/back behaviour;
- simple choice support;
- portrait/name area;
- input locking while dialogue is active;
- short sample dialogue.

Acceptance:

- dialogue can be authored in content data;
- player cannot accidentally walk away while the game believes dialogue is modal;
- choice outcome can set a test flag.

## R1-WP1.5 - Unicorn Creator V1

Dependencies: R0-WP0.4

Goal:

- establish player identity before entering the valley.

Deliverables:

- name entry;
- body colour;
- eye colour;
- mane style/colour;
- tail style/colour;
- horn style;
- marking choice;
- basic accessory slot;
- randomise;
- sensible default;
- save integration.

Acceptance:

- player can create a visually distinct unicorn;
- saved appearance survives reload;
- creator can render with placeholder layered assets.

## R1-WP1.6 - Pip Intro and First Discovery

Dependencies: R1-WP1.2, R1-WP1.4, R1-WP1.5

Goal:

- turn mechanics into a tiny playable introduction.

Deliverables:

- Pip placeholder NPC;
- welcome dialogue;
- follow/movement teaching beat;
- first sparkling collectable;
- immediate collection feedback;
- first persistent discovery flag.

Acceptance:

- new player reaches active movement quickly;
- can discover the object without reading a long tutorial;
- Pip reacts after collection;
- discovery remains recorded after reload.

## R1-WP1.7 - Wonderbook Shell

Dependencies: R1-WP1.6

Goal:

- introduce the long-term discovery metaphor.

Deliverables:

- open/close Wonderbook;
- first category page;
- discovered/undiscovered visual states;
- first discovery entry;
- sticker/reveal feedback prototype.

Acceptance:

- first discovery appears automatically;
- book can be reopened later;
- returning to gameplay is obvious.

## R1-WP1.8 - First Playable Hardening

Dependencies: R1-WP1.1 through R1-WP1.7

Goal:

- make R1 robust enough to hand to a child without developer intervention every minute.

Deliverables:

- new game/continue routing;
- autosave checkpoints;
- reload testing;
- collision sweep;
- basic touch-control experiment;
- console-error cleanup;
- child-facing text pass.

Acceptance:

- player can create unicorn -> enter glade -> meet Pip -> collect discovery -> open Wonderbook -> close browser -> continue successfully.

---

# R2 - Living Valley Vertical Slice

## R2-WP2.1 - Sunbeam Village Prototype

Dependencies: R1-WP1.8

Goal:

- add the first social hub.

Deliverables:

- village map;
- village square;
- bakery/accessory shop/library exteriors;
- paths to glade and Rainbow Meadow gate;
- initial NPC placement markers;
- scene/zone transition behaviour.

Acceptance:

- player can travel between Glade and Village reliably;
- return positions are sensible;
- layout supports several NPC interactions without clutter.

## R2-WP2.2 - Item and Inventory System

Dependencies: R0-WP0.6

Goal:

- support collectables, quest objects and owned rewards.

Deliverables:

- item definition model;
- inventory state/service;
- add/remove/query operations;
- categories;
- inventory UI v1;
- item card/icon component;
- quest-critical protection;
- tests.

Acceptance:

- item collection persists;
- quantity handling works;
- UI displays owned items clearly;
- invalid item IDs fail validation.

## R2-WP2.3 - Quest Engine V1

Dependencies: R0-WP0.6, R2-WP2.2

Goal:

- implement reusable lightweight quest progression.

Deliverables:

- quest lifecycle states;
- typed quest steps;
- event-driven step progression;
- current objective output;
- reward step;
- world-flag step;
- save integration;
- one tiny test quest;
- automated quest tests.

Acceptance:

- quest can progress across scene transitions and reloads;
- content is data-driven;
- completion can award item and set world flag.

## R2-WP2.4 - Relationship System V1

Dependencies: R0-WP0.4, R1-WP1.4

Goal:

- make friendship state persistent and useful to content.

Deliverables:

- relationship state;
- friendship tiers;
- safe progression API;
- dialogue conditions;
- relationship change event;
- Wonderbook character entry hook.

Acceptance:

- dialogue can differ based on friendship tier;
- relationship state survives reload;
- no player-facing numeric grind bar is required.

## R2-WP2.5 - Willow's Moonflowers

Dependencies: R2-WP2.2, R2-WP2.3, R2-WP2.4

Goal:

- build the first complete production story thread and prove world memory.

Deliverables:

- Willow NPC;
- Moonflower item/collectables;
- quest dialogue;
- collection objective;
- reward;
- friendship change;
- persistent garden world flag;
- empty/planted garden visual variants;
- later follow-up dialogue.

Acceptance:

- player completes the whole story without bespoke save hacks;
- Willow's garden visibly remains changed after reload;
- Willow later references what happened.

## R2-WP2.6 - Cottage Interior

Dependencies: R2-WP2.1

Goal:

- make the player's home an actual place.

Deliverables:

- cottage interior scene/map;
- enter/exit transition;
- fixed decoration zones;
- starter furniture;
- treasure display location;
- cosy placeholder presentation.

Acceptance:

- player can enter/leave reliably;
- cottage state does not reset on scene changes.

## R2-WP2.7 - Decorating V1

Dependencies: R2-WP2.2, R2-WP2.6

Goal:

- establish expression as a repeatable game loop.

Deliverables:

- decoration definitions;
- owned decoration inventory link;
- placement-slot selection;
- replace/remove item;
- persistent home state;
- decoration reward from Willow quest.

Acceptance:

- player can earn a decoration, place it, move it and see it after reload;
- invalid placements are impossible rather than error-prone.

## R2-WP2.8 - Optional Activity Suggestions

Dependencies: R2-WP2.3

Goal:

- guide without turning the game into chores.

Deliverables:

- small suggestion-card component;
- data/condition model;
- maximum visible suggestion count;
- dismissal/rotation behaviour;
- suggestions based on current world state.

Acceptance:

- player can ignore suggestions with no penalty;
- completed content no longer suggests itself incorrectly.

## R2-WP2.9 - Vertical Slice Audio/UI Pass

Dependencies: R2-WP2.1 through R2-WP2.8

Goal:

- create enough sensory coherence to test enjoyment rather than only systems.

Deliverables:

- first-pass UI skin;
- collect/discovery sounds;
- dialogue sounds;
- simple Glade/Village ambience;
- temporary music loops;
- sound settings;
- visual reward feedback.

Acceptance:

- muted game remains understandable;
- audio settings persist;
- major actions feel visibly/audibly responsive.

## R2-WP2.10A - Pre-Playtest Visual Polish and UX Fix Pass

Dependencies: R2-WP2.9

Goal:

- remove obvious presentation and clarity defects before the first daughter playtest so first-impression feedback is about the game rather than prototype roughness.

Deliverables:

- title-screen missing-graphic fix and composition pass;
- improved procedural unicorn silhouette and customisation anchors;
- creator-screen alignment and control-spacing pass;
- bridge/path/collision visual-alignment sweep;
- suggestion-card positive acknowledgement, alternate-idea and session-hide behaviour;
- exploration HUD spacing/readability pass;
- Glade, Village and Cottage presentation consistency sweep;
- visual regression/hosted smoke check where practical.

Acceptance:

- no black/missing title graphic;
- unicorn reads coherently at creator and gameplay scale;
- creator arrows/values align consistently;
- visible bridge and walkable bridge agree;
- suggestions have an obvious positive close/acknowledge path;
- obvious HUD overlaps from the pre-playtest screenshots are removed;
- existing progression remains intact.

## R2-WP2.10B - R2 Daughter Playtest and Recovery Pass

Dependencies: R2-WP2.10A

Goal:

- treat observed child behaviour as design evidence after obvious presentation defects have been removed.

Deliverables:

- structured observation notes;
- confusion/frustration findings;
- delight/repetition findings;
- issue list ranked by impact;
- fixes for progression blockers and severe UX failures;
- roadmap notes where observed preference affects later scope.

Acceptance:

- target player can complete or meaningfully explore the vertical slice with minimal adult instruction;
- major misunderstandings have a recorded resolution or explicit follow-up package.

---

# R3 - Rainbow Run Racing

## R3-WP3.1 - Rainbow Meadow and Race Hub

Dependencies: R2-WP2.10B

Goal:

- physically connect racing to the existing world.

Deliverables:

- Rainbow Meadow map extension;
- Rainbow Run hub;
- Nova placement;
- race entrance interaction;
- ribbon board placeholder;
- meadow collectables/secrets.

Acceptance:

- player can reach the race hub naturally from village exploration.

## R3-WP3.2 - Race Movement Prototype

Dependencies: R0-WP0.5

Goal:

- prove the dedicated racing control model before content/art investment.

Deliverables:

- RaceScene;
- automatic forward motion;
- jump mechanic;
- gravity/landing;
- simple course bounds;
- touch and keyboard race input;
- restart/exit flow.

Acceptance:

- jumping feels responsive;
- player can finish a placeholder course;
- mistakes do not create unrecoverable states.

## R3-WP3.3 - Race Obstacles, Boosts and Collectables

Dependencies: R3-WP3.2

Goal:

- make racing mechanically interesting.

Deliverables:

- obstacle framework;
- slowdown/stumble response;
- boost zones;
- optional race collectables;
- course data definitions;
- finish trigger.

Acceptance:

- course can be authored largely from data;
- obstacle hit slows rather than hard-fails;
- boosts/collectables are readable.

## R3-WP3.4 - NPC Racers and Position Tracking

Dependencies: R3-WP3.2

Goal:

- create actual competition without unfair AI.

Deliverables:

- NPC racer controller;
- configurable skill variance;
- position tracking;
- finish order;
- no rubber-band cheating beyond explicitly designed gentle balancing.

Acceptance:

- multiple racers finish reliably;
- player position is correctly reported;
- early opponent behaviour is beatable but not automatic.

## R3-WP3.5 - Race Results and Rewards

Dependencies: R3-WP3.3, R3-WP3.4, R2-WP2.2

Goal:

- connect racing back to persistent life-sim progression.

Deliverables:

- results screen;
- participation reward;
- podium bonus;
- personal-best tracking;
- ribbon/badge award;
- Wonderbook integration;
- persistent race records.

Acceptance:

- finishing last still produces a positive result;
- records survive reload;
- rewards can be used outside racing.

## R3-WP3.6 - Nova's First Race Story

Dependencies: R3-WP3.1, R3-WP3.5, R2-WP2.3, R2-WP2.4

Goal:

- introduce racing through character relationship rather than a menu tutorial.

Deliverables:

- Nova dialogue;
- invitation quest;
- tutorial race variant;
- result-sensitive response;
- first ribbon regardless of position;
- follow-up named race unlock.

Acceptance:

- losing the tutorial produces encouraging, non-patronising continuation;
- winning produces distinct but not progression-exclusive reward feedback.

## R3-WP3.7 - Race Assistance and Difficulty

Dependencies: R3-WP3.5

Goal:

- keep racing accessible without removing mastery.

Deliverables:

- assistance setting;
- wider jump timing and/or gentle speed support;
- early/standard course difficulty profiles;
- clear setting description without shame language.

Acceptance:

- assistance materially reduces repeated failure;
- all core rewards remain available.

## R3-WP3.8 - Racing Presentation Pass

Dependencies: R3-WP3.1 through R3-WP3.7

Goal:

- turn the prototype into an exciting repeatable activity.

Deliverables:

- race background layers;
- speed particles;
- improved placeholder race animation;
- countdown;
- race music;
- finish effects;
- readable obstacle silhouettes;
- responsive result sequence.

Acceptance:

- race communicates speed and excitement even before final production art.

## R3-WP3.9 - Racing Playtest and Balance Pass

Dependencies: R3-WP3.8

Goal:

- validate that a seven-year-old can understand, enjoy and replay racing.

Deliverables:

- observed control issues;
- difficulty adjustments;
- reward adjustments;
- race length adjustments;
- fixes for repeated frustration points.

Acceptance:

- player can finish a race consistently;
- voluntary replay is possible without being required for progression.

---

# R4 - Friendship, Secrets and Home Depth

## R4-WP4.1 - Conditional Dialogue Expansion

Dependencies: R2-WP2.4

Goal:

- make characters visibly remember more than one quest state.

Deliverables:

- dialogue condition priority rules;
- first/return greeting variants;
- quest-complete callbacks;
- friendship-tier lines;
- content validation for conditional dialogue.

Acceptance:

- NPC conversations change naturally across several sessions without hard-coded scene branches.

## R4-WP4.2 - Pip's Strange Egg Arc

Dependencies: R2-WP2.3, R2-WP2.7

Goal:

- create the first multi-session mystery and companion seed.

Deliverables:

- clue trail;
- egg discovery;
- cottage egg placement;
- activity/session-based staged progression;
- visual egg changes;
- hatch scene;
- first companion state.

Acceptance:

- no real-world waiting timer;
- closing browser cannot lose the egg;
- progression feels like anticipation rather than grinding.

## R4-WP4.3 - Shop and Shimmer Economy V1

Dependencies: R2-WP2.2, R2-WP2.7, R3-WP3.5

Goal:

- add a simple generous path from activities to chosen cosmetics/decorations.

Deliverables:

- Shimmer balance;
- earn/spend service;
- shop UI;
- accessory and furniture stock;
- purchase persistence;
- insufficient-funds feedback.

Acceptance:

- one currency only;
- ordinary play earns enough for meaningful purchases;
- no core story progress depends on buying an item.

## R4-WP4.4 - Marigold's Picnic Event

Dependencies: R2-WP2.3, R4-WP4.1

Goal:

- create a social event involving multiple NPCs and player expression.

Deliverables:

- Marigold NPC content;
- picnic preparation quest;
- visual theme choice;
- meadow event state;
- group NPC placement/dialogue;
- persistent memory in Wonderbook.

Acceptance:

- selected theme visibly affects event presentation/dialogue;
- player cannot make a "wrong" theme choice.

## R4-WP4.5 - Secret and Discovery Framework Expansion

Dependencies: R1-WP1.7

Goal:

- support reusable secrets beyond one-off sparkles.

Deliverables:

- conditional discovery definitions;
- hidden object/path reveal;
- discovery feedback tiers;
- Wonderbook secret entries;
- replay-safe persistence.

Acceptance:

- at least three different secret patterns use the shared framework.

## R4-WP4.6 - Pebble Collection Story

Dependencies: R4-WP4.5, R2-WP2.2

Goal:

- connect collectables to a character and visible world/home changes.

Deliverables:

- Pebble NPC;
- odd-object collection quest;
- display/decoration reward;
- repaired or modified world object;
- follow-up dialogue.

Acceptance:

- collection is exploration-driven, not low-probability grinding.

## R4-WP4.7 - Cottage Decoration Expansion

Dependencies: R2-WP2.7, R4-WP4.3

Goal:

- make home expression broad enough to support repeat play.

Deliverables:

- multiple furniture themes;
- wall/floor/table/shelf categories;
- visual placement preview;
- clearer decorate-mode UI;
- display slot for race ribbons/treasures.

Acceptance:

- player can create noticeably different cottage styles;
- decoration mode remains understandable without adult instruction.

## R4-WP4.8 - Friend Visits V1

Dependencies: R4-WP4.1, R2-WP2.6

Goal:

- demonstrate that friendship affects the player's personal space.

Deliverables:

- visit eligibility conditions;
- one or two scripted visitor moments;
- dialogue referencing cottage/world state;
- safe placement of NPC in cottage.

Acceptance:

- visit feels like consequence of friendship, not random UI event.

## R4-WP4.9 - R4 Persistence Audit

Dependencies: R4-WP4.1 through R4-WP4.8

Goal:

- ensure growing state complexity remains coherent.

Deliverables:

- save schema review;
- migration coverage;
- quest/world/relationship consistency tests;
- stale-state cleanup rules;
- representative long-running save fixture.

Acceptance:

- simulated older saves migrate;
- completed content cannot accidentally regress to incomplete state;
- no duplicate unique rewards after reload/re-entry.

---

# R5 - The Valley Gets Bigger

## R5-WP5.1 - Crystal Brook Region

Dependencies: R4-WP4.9

Goal:

- add the first substantial exploration region beyond the starting hub.

Deliverables:

- region map;
- stepping-stone/water landmarks;
- crystal/shell collectables;
- region ambience;
- one secret route;
- NPC visit points.

Acceptance:

- area has a recognisable identity and useful reasons to revisit.

## R5-WP5.2 - Crystal Brook Story Content

Dependencies: R5-WP5.1, R2-WP2.3

Goal:

- ensure new region is not just empty scenery.

Deliverables:

- one character-led quest;
- one independent discovery chain;
- one home/display reward;
- world-state change.

Acceptance:

- region supports at least one complete visit loop plus later return interest.

## R5-WP5.3 - Whispering Woods Region

Dependencies: R4-WP4.9

Goal:

- add a contrasting gentle-mystery region.

Deliverables:

- woods map;
- layered canopy;
- glowing plants/mushrooms;
- hidden path framework use;
- distinct ambience;
- safe navigation cues.

Acceptance:

- area feels mysterious without becoming frightening or difficult to navigate.

## R5-WP5.4 - Lumi and Woods Discovery Story

Dependencies: R5-WP5.3, R4-WP4.5

Goal:

- introduce Lumi through investigation rather than exposition.

Deliverables:

- Lumi NPC;
- clue dialogue;
- unusual environmental event;
- Wonderbook lore/discovery page;
- persistent secret reveal.

Acceptance:

- story can be followed through short clues and visual guidance.

## R5-WP5.5 - First Non-racing Mini-game

Dependencies: R0-WP0.5

Goal:

- prove the game can support short activity modules besides races.

Preferred candidate:

- flower gathering, constellation matching or firefly/lantern activity chosen based on R2/R3 play observations.

Deliverables:

- dedicated activity flow;
- scoring/reward only as needed;
- retry/exit;
- touch input;
- persistent first-completion memory.

Acceptance:

- activity takes only a few minutes;
- failure is gentle;
- activity adds variety rather than becoming mandatory grind.

## R5-WP5.6 - Atmospheric Time States

Dependencies: R5-WP5.1, R5-WP5.3

Goal:

- make familiar regions visually change without real-world lockouts.

Deliverables:

- morning/afternoon/sunset/night visual hooks;
- scene lighting/overlay data;
- optional manual/progression-driven state selection;
- NPC/discovery condition hooks.

Acceptance:

- all important content remains eventually accessible regardless of real-world clock.

## R5-WP5.7 - Magical Weather States

Dependencies: R5-WP5.6

Goal:

- create occasional visual wonder and discovery conditions.

Deliverables:

- rain;
- sparkle shower or equivalent magical state;
- ambience/effects;
- at least one conditionally appearing discovery;
- state persistence rules.

Acceptance:

- weather does not punish or block ordinary play;
- effects remain performant.

## R5-WP5.8 - Second Race Course

Dependencies: R3-WP3.9, R5-WP5.1 or R5-WP5.3

Goal:

- prove racing content can expand without rewriting RaceScene.

Deliverables:

- new course data;
- region-specific visuals;
- different obstacle pattern;
- new ribbon/result entry;
- optional shortcut or route variation.

Acceptance:

- new course mostly uses existing race systems and data definitions.

## R5-WP5.9 - Exploration Playtest and Content Density Pass

Dependencies: R5-WP5.1 through R5-WP5.8

Goal:

- ensure larger world has enough meaningful interaction density.

Deliverables:

- dead-zone observations;
- navigation fixes;
- additional small discoveries where needed;
- revisitation check;
- performance check across larger asset set.

Acceptance:

- new regions do not feel like long walks between isolated quest markers.

---

# R6 - Production Presentation and Accessibility

## R6-WP6.1 - Player Unicorn Production Art

Dependencies: stable customisation model from R1/R4

Goal:

- replace placeholder player visuals with coherent modular production-quality art.

Deliverables:

- final body base;
- palettes/tint strategy;
- mane/tail sets;
- horn sets;
- markings;
- accessory integration;
- overworld animation set.

Acceptance:

- custom combinations render consistently;
- silhouette is recognisable at gameplay scale;
- appearance system remains performant.

## R6-WP6.2 - Core NPC Production Art

Dependencies: R6-WP6.1 art language

Goal:

- finalise visual identity of Nova, Willow, Pip, Pebble, Lumi and Marigold.

Deliverables:

- NPC overworld sprites;
- portraits/expressions;
- character-specific visual motifs;
- core idle/reaction animation.

Acceptance:

- each NPC is recognisable by silhouette/colour/motif without reading a name.

## R6-WP6.3 - Environment Production Pass

Dependencies: maps largely stable

Goal:

- replace prototype world visuals without changing established navigation unnecessarily.

Deliverables:

- Glade;
- Village;
- Rainbow Meadow/Run;
- Crystal Brook;
- Whispering Woods;
- foreground/ambient props;
- region palette consistency.

Acceptance:

- interactables and paths remain readable;
- no production asset introduces collision ambiguity.

## R6-WP6.4 - UI and Wonderbook Production Pass

Dependencies: UI flows stable

Goal:

- create a coherent storybook interface.

Deliverables:

- button set;
- dialogue skin;
- inventory cards;
- shop/decoration UI;
- settings;
- Wonderbook pages/tabs/sticker animation;
- accessibility states.

Acceptance:

- screen remains clear at target resolutions;
- touch targets remain large after visual polish.

## R6-WP6.5 - Music, SFX and Ambience Production Pass

Dependencies: region/activity list stable

Goal:

- establish cohesive audio identity.

Deliverables:

- region music;
- race music;
- menu/home audio;
- core SFX set;
- region ambience;
- NPC reaction sound set where practical;
- mixing pass.

Acceptance:

- loops are not irritatingly short;
- settings control buses correctly;
- no critical information is audio-only.

## R6-WP6.6 - Touch and Accessibility Hardening

Dependencies: R6-WP6.4

Goal:

- make tablet play a first-class experience.

Deliverables:

- final movement touch control;
- interaction touch behaviour;
- menu target review;
- text-size review;
- reduced-motion option;
- high-visibility interaction option where useful;
- race assistance review.

Acceptance:

- full core loop can be completed on target tablet form factor without keyboard/mouse.

## R6-WP6.7 - Performance and Load Optimisation

Dependencies: R6 production assets

Goal:

- keep polished assets from damaging playability.

Deliverables:

- bundle/asset size review;
- texture/audio compression;
- preload strategy;
- region loading review;
- frame-rate profiling;
- expensive update-loop cleanup.

Acceptance:

- stable target performance on ordinary laptop/tablet hardware used for testing;
- no severe hitching on normal scene transitions.

## R6-WP6.8 - Save/Recovery Hardening

Dependencies: mature save schema

Goal:

- protect the player's emotional investment.

Deliverables:

- migration tests from representative historical versions;
- backup-before-migration where practical;
- corruption fallback behaviour;
- optional parent-facing export/import backup if justified;
- reset flow protected by confirmation.

Acceptance:

- an ordinary game update does not erase a valid older save;
- destructive reset is difficult to trigger accidentally.

## R6-WP6.9 - Browser and Deployment Hardening

Dependencies: R6-WP6.1 through R6-WP6.8

Goal:

- make hosted build dependable.

Deliverables:

- Chrome/Edge/Firefox/Safari-family checks where accessible;
- Cloudflare Pages production test;
- preview deployment workflow check;
- reload/asset caching checks;
- mobile/tablet browser checks;
- console/error audit.

Acceptance:

- no known critical browser-specific blocker on supported targets.

---

# R6.5 - Valley Completeness and Breadth

R6.5 is the mandatory current release after the completed R6 human gate and before any R7 preference review.

The detailed scope, quantitative content-density targets, region requirements and acceptance criteria are authoritative in `07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`. `07W-R6.5-CONTENT-BLUEPRINT.md` and `07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md` are mandatory companion specifications for the packages they cover; in particular, WP2 cannot be accepted without satisfying the complete 07X autonomous-life contract.

## R6.5-WP1 - Valley Content Audit and Density Contract

Dependencies: R6-WP6.18 human gate released

Goal:

- establish the exact current content baseline and final implementation checklist for R6.5.

## R6.5-WP2 - Ambient Population and World Interaction Toolkit

Dependencies: R6.5-WP1

Mandatory companion specification: `07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md`

Goal:

- provide reusable supporting-unicorn, ambient-life and small world-interaction patterns;
- implement purposeful autonomous routines, contextual relocation, story anchors and stop/face/talk/resume behaviour required by 07X.

Acceptance:

- WP2 is not complete until the full autonomous-life acceptance and regression contract in 07X passes.

## R6.5-WP3 - Economy and Reward Loop Completion

Dependencies: R6.5-WP1

Goal:

- make rewards, Shimmer and shop progression useful without grind.

## R6.5-WP4 - Sunbeam Village Life, Shops and Interiors

Dependencies: R6.5-WP2, R6.5-WP3

Goal:

- make the Village a busy repeat-use social and commercial hub.

## R6.5-WP5 - Moonflower Glade and Cottage Depth

Dependencies: R6.5-WP2, R6.5-WP3

Goal:

- make home richer, more interactive and visibly personal over time.

## R6.5-WP6 - Rainbow Meadow and Rainbow Run Depth

Dependencies: R6.5-WP2, R6.5-WP3

Goal:

- deepen Meadow/Run landmarks, population, secrets and non-registration content.

## R6.5-WP7 - Crystal Brook Depth

Dependencies: R6.5-WP2

Goal:

- make Crystal Brook a dense exploration destination rather than a corridor.

## R6.5-WP8 - Whispering Woods Depth

Dependencies: R6.5-WP2

Goal:

- deepen Woods mysteries, population, sublocations, secrets and revisit content.

## R6.5-WP9 - Starlight Beach Core Region

Dependencies: R6.5-WP1, R6.5-WP2

Goal:

- add Starlight Beach as a full production exploration region.

## R6.5-WP10 - Starlight Beach Content Pack

Dependencies: R6.5-WP9, R6.5-WP3

Goal:

- launch Starlight Beach with residents, quests, secrets, activity hooks, rewards and race-hub integration rather than as an empty map.

## R6.5-WP11 - Quest Pack A: Existing Valley

Dependencies: R6.5-WP4 through R6.5-WP8

Goal:

- substantially increase quest/story density across the existing valley with varied verbs and follow-up content.

## R6.5-WP12 - Race Expansion and Rainbow Cup

Dependencies: R6.5-WP3, R6.5-WP6, R6.5-WP8, R6.5-WP9, R6.5-WP10

Goal:

- expand racing to five distinct course experiences and add a friendly multi-race Rainbow Cup.

## R6.5-WP13 - Quest Pack B: Cross-Region and Follow-up Stories

Dependencies: R6.5-WP10, R6.5-WP11, R6.5-WP12

Goal:

- connect the broadened valley through cross-region stories, supporting residents and character follow-ups;
- add however many substantive threads remain necessary after the WP1/WP11 reconciliation to guarantee at least six new substantive R6.5 story threads, excluding lightweight microstories from that six-thread minimum.

Acceptance:

- the reconciled R6.5 content matrix reaches both at least 12 meaningful total story/quest threads and at least six new substantive R6.5 threads.

## R6.5-WP14 - Repeatable Activity Expansion

Dependencies: R6.5-WP3, R6.5-WP4, R6.5-WP10

Goal:

- add at least two repeatable non-racing activities alongside Firefly Lantern.

## R6.5-WP15 - Wonderbook, Collections and Long-Term Goals

Dependencies: R6.5-WP4 through R6.5-WP14

Goal:

- make the Wonderbook reflect and gently motivate the broadened world, characters, races, secrets and collections.

## R6.5-WP16 - Valley Tidy-up, Balance and Content Polish

Dependencies: R6.5-WP3 through R6.5-WP15

Goal:

- resolve accumulated minor defects, balance the broader content and verify mobile/performance quality.

## R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate

Dependencies: R6.5-WP16

Goal:

- verify through human play that the valley is broad and complete enough for preference-led observation to be meaningful.

Acceptance:

- the user explicitly confirms the build has enough credible places, interactions, residents, quests, shops, races and activities to release R7-WP7.1.

---

# R7 - Daughter-led Expansion

R7 deliberately uses evidence from play rather than fixed feature assumptions. It is blocked until the R6.5 breadth gate is explicitly released.

## R7-WP7.1 - Structured Preference Review

Dependencies: R6.5-WP17 explicitly released by the human breadth/readiness gate

Goal:

- determine which fantasy the target player is actually pursuing most strongly now that the available alternatives have credible content breadth.

Deliverables:

- observation summary across several sessions where available;
- most-repeated activities;
- favourite characters/places;
- customisation behaviour;
- requests made spontaneously;
- abandoned/ignored features;
- top three expansion hypotheses.

Acceptance:

- next major scope is justified by observed behaviour, not adult guesswork or uneven content availability.

## R7-WP7.2A - Customisation Expansion

Trigger: customisation is a dominant behaviour.

Potential deliverables:

- more mane/tail/horn sets;
- outfit layers;
- saved favourite looks;
- magical effects;
- themed rewards.

## R7-WP7.2B - Cottage/Garden Expansion

Trigger: home decoration is a dominant behaviour.

Potential deliverables:

- extra room;
- garden;
- interactive furniture;
- more flexible placement;
- friend visits.

## R7-WP7.2C - Racing Expansion

Trigger: racing is a dominant behaviour.

Potential deliverables:

- deeper championship/cups;
- additional courses;
- route choices;
- rival story;
- later flying race groundwork.

## R7-WP7.2D - Exploration Expansion

Trigger: exploration/secrets are a dominant behaviour.

Potential deliverables:

- denser secret chains;
- creature discoveries;
- Cloudtop Peaks foreshadowing;
- other new regions justified by observed play.

## R7-WP7.2E - Companion Expansion

Trigger: egg/companion content is a dominant behaviour.

Potential deliverables:

- companion following;
- multiple creatures;
- companion home interactions;
- companion cosmetic items;
- creature discovery chains.

Only the relevant branch(es) should be promoted to committed roadmap work after R7-WP7.1.

---

# Current execution sequence

R0 through R6 are complete. The active work queue is R6.5, in this order unless a technical dependency or human blocker requires a bounded adjustment:

1. R6.5-WP1 - Valley Content Audit and Density Contract
2. R6.5-WP2 - Ambient Population and World Interaction Toolkit
3. R6.5-WP3 - Economy and Reward Loop Completion
4. R6.5-WP4 - Sunbeam Village Life, Shops and Interiors
5. R6.5-WP5 - Moonflower Glade and Cottage Depth
6. R6.5-WP6 - Rainbow Meadow and Rainbow Run Depth
7. R6.5-WP7 - Crystal Brook Depth
8. R6.5-WP8 - Whispering Woods Depth
9. R6.5-WP9 - Starlight Beach Core Region
10. R6.5-WP10 - Starlight Beach Content Pack
11. R6.5-WP11 - Quest Pack A: Existing Valley
12. R6.5-WP12 - Race Expansion and Rainbow Cup
13. R6.5-WP13 - Quest Pack B: Cross-Region and Follow-up Stories
14. R6.5-WP14 - Repeatable Activity Expansion
15. R6.5-WP15 - Wonderbook, Collections and Long-Term Goals
16. R6.5-WP16 - Valley Tidy-up, Balance and Content Polish
17. R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate

Do not begin R7-WP7.1 before item 17 has been explicitly released.

# Package completion record

As work is executed, each package should be marked with one of:

- Planned
- In Progress
- Complete
- Superseded
- Blocked

For substantial packages, implementation notes should record:

- final scope;
- key files/systems added;
- validation performed;
- deviations from design;
- follow-up work discovered.

This makes the repository itself sufficient to resume development in a new conversation without depending on conversational memory.
