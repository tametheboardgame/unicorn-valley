---
id: MG
title: Mini-Game Development Programme
status: approved
autonomy: amber
depends_on: []
parallel_safe: true
human_gate: architecture
---

# Unicorn Valley Mini-Game Development Roadmap

Programme ID: **MG**

Status: **approved direction / independent programme**

## Current stage

**MG-WP0 through MG-WP6 are complete, with MG-WP6 — Rainbow Disc receiving final human approval on 2026-10-06. MG-WP7 — Pond Leap expansion is next. A later MG-WP14 second pass will return to Chess Academy for a much larger curriculum and local pass-and-play chess.**

The shared catalogue/session/launcher/outcome foundation, existing-game migration, sandbox isolation, Just Games catalogue and future-authoring guardrails are the accepted baseline. MG-WP5 applied that platform to a substantial child-first teaching and play redesign of the existing chess game.

This roadmap is intentionally independent of the main release roadmap. It is not an R6.5, WP19 or area-polish sub-stream. Mini-game platform work and mini-game improvement work may proceed in parallel with world, Story House and other content programmes when dependencies genuinely permit.

The canonical mini-game architecture is `docs/architecture/MINI-GAME-PLATFORM.md`. The repo-wide authoring rules in `AGENTS.md`, `ACCEPTANCE.md` and `docs/architecture/ENGINEERING-STANDARDS.md` apply to every roadmap and work package, regardless of which programme originated the game.

## Purpose

Create and maintain a durable portfolio of embedded games that are discovered naturally through Unicorn Valley, playable through **Just Games**, and deep enough to be satisfying games in their own right.

The normal product flow is **world-first**:

1. the main world/release roadmap reaches a location, character or story moment where a game belongs;
2. that world package creates the first coherent playable version and declares it as a new mini-game;
3. the platform contract gives that same implementation its Just Games entry at first implementation;
4. the Mini-Game programme can later revisit the existing game as a dedicated product/refinement package, deepening modes, teaching, replayability, presentation and accessibility without creating a second implementation.

The architecture also supports an explicit Just-Games-first game when there is a genuine product reason, but this is not the default content-authoring model.

The same canonical game implementation must serve both entry points.

**Just Games** is therefore not a parallel copy of the games and is not normally the place where new game ideas originate. It is a catalogue and launcher over games that belong to the wider Unicorn Valley world.

### Product quality target

“Mini-game” describes architectural scope, not ambition. A game can sit inside a larger game while still being a substantial, replayable experience.

Improvement packages should ask:

- does the game have a satisfying core loop rather than a one-off interaction;
- would meaningful modes, levels, lessons, challenges or variants improve replayability;
- is there a clear difficulty/progression curve appropriate for a young player;
- does the game teach itself through play rather than relying on dense instructions;
- is retry/replay friction low;
- does touch/stylus/keyboard input feel intentional;
- does the game have enough personality and feedback to feel like part of Unicorn Valley;
- can a child enjoy it repeatedly without adventure progression or reward pressure.

**Firefly Lantern** is the current reference point for useful mode/difficulty depth, but other games should adopt only the forms of depth that fit their mechanics.

## What counts as a mini-game

A feature belongs to this programme when it is a bounded playable activity with its own short gameplay loop, clear start/finish/retry behaviour and a repeatable or practice-oriented interaction model.

Typical examples include:

- sports and skill games;
- races and race families;
- timing/aiming games;
- puzzles or board games;
- making/baking activities with an active play loop;
- collection/search activities with a discrete run;
- other optional repeatable activities.

A story conversation, shop, exploration interaction, ordinary quest step, creator flow or passive environmental interaction is not automatically a mini-game.

When classification is genuinely ambiguous, the active work package must make the choice explicit. Do not avoid the platform contract merely by giving a mini-game another name.

## Non-negotiable cross-roadmap rule

Every current/next work package must declare `mini_game_platform_impact` in front matter. Any roadmap or package that creates or materially changes a mini-game must use the appropriate `changed`/`new` value rather than `none`.

For a new mini-game, completion requires:

- one stable mini-game ID;
- one canonical gameplay implementation;
- one catalogue definition;
- one manifest-backed scene/load path;
- support for the shared launch/session contract;
- a Just Games entry;
- a world-compatible launch path, even if the game has not yet been physically placed in the world;
- context-safe return behaviour;
- context-safe persistence/reward behaviour;
- automated validation of catalogue integrity and launch/return behaviour;
- touch/keyboard behaviour appropriate to the game.

A world-first mini-game must not wait for a later “Just Games integration” package.

A Just-Games-first mini-game may remain **world-unplaced**, but it must already be world-ready: it cannot assume the title screen is its caller, cannot hard-code its return destination, and cannot depend on Just Games-only state.

## Current implemented portfolio

The initial catalogue contains these game families:

| Mini-game family | Existing implementation | Important variants |
| --- | --- | --- |
| Rainbow Run Racing | race runtime, five regular courses and Rainbow Cup progression | Sunrise Sprint, Petal Parade, Crystal Cascade, Mooncap Trail, Shoreline Surge; tutorial remains a story entry, not a separate catalogue game |
| Rainbow Disc | `RainbowDiscActivityScene` | Match, Practice |
| Sunbeam Chess | `ChessPlazaActivityScene` | standard chess activity |
| Wobbly Cake Baking | `MapleBakingActivityScene` | quest and repeatable world modes; Just Games uses a sandbox/practice session |
| Firefly Lantern | `FireflyLanternScene` | supported lantern modes and difficulty choices |
| Pond Leap | `PondLeapActivityScene` | standard timing run |
| Coral Beachcombing | `CoralBeachcombingActivityScene` | standard beachcombing run |

The platform migration is complete. Dedicated MG-WP5+ packages now have explicit authority to improve the named game's teaching, modes, rules presentation, accessibility and replay depth within that package's bounds, while preserving its world/story integration contract.

## Main-roadmap-owned future additions - reference only

The following world-first games are already owned by the R6.5-WP19H6 Crystal Brook roadmap. They are recorded here only so the portfolio view remains complete. Their **initial implementation belongs to the main roadmap, not to a new MG package**:

| Planned mini-game | Originating world package | Platform declaration | Direction |
| --- | --- | --- | --- |
| Crystalarium | R6.5-WP19H6.9 | `new - crystalarium - world-first` | Crystal merge game using Resonance Patterns to restore magical formations; no customer/energy-timer fiction |
| Crystal Checkers | R6.5-WP19H6.10 | `new - crystal-checkers - world-first` | Standard checkers/draughts on a physical crystal-rock board, shared between Crystal Brook and Just Games |

MG-WP0-WP4 have now satisfied the shared catalogue/launcher/session/sandbox/authoring readiness contract. H6 can create these games through the normal world-first path. After they exist, this programme may later create dedicated refinement packages if human playtesting identifies worthwhile depth work.

## Platform sequence

The platform is deliberately built before the individual improvement passes. Implementation evidence from MG-WP0 confirmed that migration and sandbox isolation must precede the visible Just Games launcher, so the safe dependency order is **MG-WP0 -> MG-WP1 -> MG-WP2 -> MG-WP3 -> MG-WP4**.

### MG-WP0 - Mini-game platform foundation

Goal: establish the architecture, ownership and validation contract before changing visible gameplay.

Deliverables:

- canonical `MiniGameId`, definition and launch/session contracts;
- one `MiniGameCatalogue` that describes game families and their selectable variants;
- integration with the existing `SceneManifest` rather than a competing scene registry;
- generic `MiniGameLauncher` ownership for loading, caller pause/resume, return targets and session context;
- context-aware outcome/persistence boundary;
- catalogue validation;
- migration plan for current registration/return inconsistencies;
- verification ownership for the new subsystem.

Acceptance:

- a mini-game can be described without embedding world coordinates or title-screen assumptions;
- the architecture supports `world` and `just-games` launch contexts through the same game scene;
- the catalogue does not load scene constructors independently of `SceneManifest`;
- the sandbox policy prevents Just Games from mutating normal world progression by default.

Detailed package: `docs/work-packages/MG-WP0-MINI-GAME-PLATFORM-FOUNDATION.md`.

### MG-WP3 - Just Games home and catalogue experience

Goal: make the platform visible from the home screen.

Deliverables:

- add **Just Games** to the title/home menu;
- add an on-demand `JustGamesScene`;
- generate game cards from the catalogue rather than hard-coding a second list;
- child-readable game title, short description and simple visual identity;
- variant selection where required, such as Rainbow Disc Match/Practice or race/course selection;
- Back returns cleanly to the title/home menu;
- keyboard and touch navigation use the normal UI system.

Acceptance:

- every catalogue-visible current mini-game can be discovered without entering the main world;
- adding a future catalogue entry does not require editing a second hard-coded Just Games list;
- Just Games remains a launcher, not an owner of game logic.

### MG-WP1 - Existing game migration to one launch contract

Goal: remove the current mixture of direct dynamic registration, bespoke return logic and hard-coded caller assumptions.

Migration targets include:

- Chess and Pond Leap, which currently sit outside the canonical scene manifest path;
- Wobbly Cake, whose world scene currently performs direct lazy import/scene registration despite a manifest definition;
- Rainbow Disc registration/helper duplication;
- Firefly Lantern's Woods-specific return assumptions;
- racing's specialist return-context handling;
- any equivalent beach/activity launch path found during implementation audit.

Deliverables:

- every catalogue game launches through the shared launcher;
- every underlying gameplay scene uses a normalised mini-game session context;
- callers no longer need mini-game-specific scene registration code;
- world entry points preserve their current interaction labels, quest semantics and physical placement;
- Just Games uses the same launcher.

Acceptance:

- no migrated game has separate “world” and “Just Games” gameplay implementations;
- enter/exit/retry works from both launch contexts;
- world callers resume/return to the correct place;
- Just Games always returns to the catalogue.

### MG-WP2 - Sandbox, rewards and persistence isolation

Goal: make Just Games safe for repeated testing and child play without corrupting the adventure save.

The default Just Games session is a sandbox.

It may read:

- player appearance;
- accessibility/settings;
- static game definitions;
- safe display-only records where explicitly supported.

It must not, by default:

- advance quests;
- set world/story flags;
- change relationships;
- grant or consume inventory;
- grant or consume Shimmer;
- unlock world progression;
- alter collection/Wonderbook progression;
- trigger one-time story rewards.

Deliverables:

- one outcome gateway that applies results according to launch context;
- explicit world versus sandbox policy for each current game;
- Wobbly Cake practice that does not charge Shimmer;
- Firefly/Race/game progression changes suppressed or isolated in sandbox;
- explicit policy for personal/practice records.

Default record rule:

- Just Games records are ephemeral until a separate isolated record namespace exists;
- if durable practice records are later added, they must be provably non-progression data and must never unlock world content indirectly.

Acceptance:

- the same game can be played repeatedly from Just Games without changing adventure progression;
- world launches retain accepted reward/progression behaviour.

### MG-WP4 - Future mini-game authoring kit and guardrails

Goal: make the correct path the easiest path for every future roadmap.

Deliverables:

- documented authoring recipe;
- catalogue integrity tests for unique IDs, valid scene keys and valid variants;
- reusable launch/return browser contract;
- reusable sandbox side-effect regression contract;
- verification ownership rules for `src/game/minigames/**` and catalogue changes;
- a mechanically enforced work-package declaration requiring `mini_game_platform_impact` before a package can become current/next;
- no-production test fixture or deterministic harness proving a game can be authored once and launched from both contexts.

Acceptance:

- a fresh agent can add a new game by following one documented path;
- a future world roadmap cannot complete a new mini-game while silently omitting Just Games integration;
- a Just-Games-first game can later receive a world placement without changing its core gameplay code.

## Existing-game refinement sequence

MG-WP0 through MG-WP4 established the platform. The next phase deliberately improves **games that already exist**.

New game creation normally remains in the main world/release roadmap. Once a game exists and is platform-compliant, this programme may deepen it independently.

**Racing is explicitly excluded from the current refinement sequence.** Rainbow Run Racing, race hubs, Cup progression, course presentation and controls require a dedicated future racing overhaul rather than an ordinary mini-game improvement pass.

### MG-WP5 - Sunbeam Chess Academy

Goal: turn the existing Sunbeam Chess activity into a friendly, genuinely useful chess-teaching game for a child around the early-primary age range, while retaining fully legal chess underneath it.

This is not an “easy AI” patch. It is a teaching/play system.

Design direction:

- introduce a warm Unicorn Valley chess-teacher character who coaches rather than lectures;
- keep the existing legal-rules engine as the source of truth;
- add a **Learn** path made from short interactive lessons and piece-specific micro-games;
- add **Puzzles/Challenges** using constrained positions rather than requiring a full match for every learning objective;
- add **Coach Play**, where the child can play a real match with optional contextual guidance;
- add **Friendly Play** for ordinary games without continuous coaching;
- consider several deliberately child-friendly opponent strengths rather than one punishing “correct” AI;
- use hints as questions and visual cues first: “What can their bishop see?”, “Is anything attacking that piece?”, “Can you make a check?”;
- for an obvious beginner blunder in Coach Play, the teacher may gently ask whether the player wants another look, but must always allow the child to choose the move;
- allow undo/retry freely in lessons and coached learning where it supports experimentation;
- explain mistakes positively after discovery rather than treating them as failure;
- celebrate good ideas such as spotting a capture, defending a piece, escaping check or finding mate, not only wins;
- teach incrementally rather than exposing the whole strategy tree at once;
- keep text short and use board highlights/animation as the primary teaching language;
- preserve touch-first play and make stylus input naturally usable.

Suggested learning progression:

1. board orientation and how pieces move;
2. capturing and keeping pieces safe;
3. check and getting out of check;
4. checkmate versus stalemate;
5. simple mate patterns;
6. piece value and “is this piece safe?”;
7. forks, pins and simple tactical patterns;
8. opening principles without memorised opening theory;
9. basic endgames and promotion;
10. special rules such as castling and en-passant once the core game is comfortable.

Potential modes at the end of the package:

- **Lessons**;
- **Puzzle Garden**;
- **Coach Match**;
- **Friendly Match**;
- optional **Challenge** positions for mastered topics.

Progress should, if persisted, use an isolated mini-game learning-record namespace and must never become adventure quest/economy/unlock state. World and Just Games entry use the same Chess Academy implementation.

Human acceptance should focus on whether a seven-year-old can learn, experiment and lose without the game becoming frustrating or patronising.

#### MG-WP5D Coach Match interaction-polish contract

Human review of the first Coach Match preview requires the teaching panel to behave like a conversation rather than a dashboard.

- the coach's spoken guidance must appear in a speech bubble visually connected to the coach portrait;
- status and teaching copy must not compete in stacked rectangular panels;
- after the player makes a move, the coach explanation must remain readable before the village reply begins;
- Coach Match should hold player-move feedback for roughly two seconds before the automatic reply, rather than replacing it after ~0.5 seconds;
- the village-move explanation should remain visible until the player next interacts or requests help;
- match history must be a dedicated reusable component shared by Coach Match and Friendly Match;
- history must show full-move rows, not only the last three lines with no navigation;
- history must have explicit touch-friendly up/down controls plus a visible range indicator;
- the history component should follow the newest moves by default but allow the player to browse earlier moves without losing the current game;
- Friendly Match receives the same move-history navigation even though it does not use the coach speech bubble.

#### MG-WP5C visual polish implementation brief

Human review of the first Puzzle Garden preview identified three concrete presentation defects that must be corrected before WP5C acceptance.

**1. Replace the placeholder coach portrait**

The current hand-drawn coach badge is not acceptable as a finished character asset/presentation.

Implementation requirements:

- replace the malformed side-profile blob with a deliberately constructed friendly unicorn teacher portrait;
- use a clear head silhouette with readable muzzle, ear, eye, horn and mane separation;
- face the character slightly toward the content rather than presenting a flattened horizontal head;
- keep the portrait legible at the small Academy Home size and the smaller lesson/puzzle size;
- use the same coach identity consistently across Academy Home, Lessons and Puzzle Garden;
- use the existing production NPC/unicorn presentation pipeline rather than another bespoke procedural doodle;
- give the coach a distinctive academy accent such as a small collar/medallion or star detail without adding visual clutter;
- do not introduce a new roaming world NPC in this slice.

**2. Correct Academy safe-area and spacing**

The 1280 x 720 game-space composition must remain comfortably inside its rounded shell when viewed on a phone in landscape.

Implementation requirements:

- maintain at least 32 px visual inset between the shell edge and primary controls;
- move the Academy Home Back control fully inside the shell rather than touching/overlapping the bottom/right border;
- reserve a dedicated bottom action row so card content never competes with navigation controls;
- give the teacher/intro band more vertical breathing room;
- keep all four Academy Home mode cards visually balanced and separated;
- ensure Lessons and Puzzle Garden lists remain readable with eight lessons / four puzzles without crowding the bottom action row;
- the first lesson/puzzle row must begin below the teacher portrait/intro band with a clear visible gap; nothing may overlap the coach portrait;
- keep touch targets at least 48 px high;
- no primary text or control may visually intersect the shell border at the 1280 x 720 logical viewport.

**3. Replace the dull beige/pastel shell with a more exciting Chess Academy identity**

The chess board remains intentionally traditional and readable. The surrounding Academy UI should feel like a magical Unicorn Valley activity, not a muted beige chess utility.

Palette direction:

- deep royal violet/plum for the outer Academy field and strong headings;
- brighter lavender/periwinkle and berry accents for mode cards;
- turquoise/mint as the secondary action/accent colour;
- warm gold for academy/star highlights;
- clean pale lilac/cream content surfaces only as neutral support;
- disabled/coming-soon content may be softened but must not turn the entire interface grey/brown.

Implementation requirements:

- Academy shell gets a stronger violet identity and coloured header treatment;
- cards use distinct but related accent treatments rather than identical beige panels;
- active buttons use brighter mint/turquoise with clear violet text/borders;
- teacher panels and informational cards use pale lilac/blue surfaces;
- retain sufficient contrast for child-readable text;
- preserve the existing classic board square colours unless readability testing proves a change is necessary;
- reuse one small Chess Academy palette constant set rather than scattering additional arbitrary colours through the scene.

**WP5C visual acceptance**

Before WP5C is accepted, the human preview must show:

- a coherent, recognisable unicorn coach portrait;
- no Back/action control touching the shell boundary;
- comfortable spacing at the phone-landscape layout;
- a visibly brighter, more magical Academy UI;
- no regression to Lessons, Puzzle Garden or Friendly Match interaction;
- the chess board remaining the stable visual anchor;
- completing a lesson or puzzle must produce an obvious celebratory completion overlay rather than only changing small status text;
- the completion overlay must be centred across roughly 80% of the activity content area, spanning both the board and teaching panel rather than living only in the right-hand panel;
- the completed board/instructions should remain faintly visible behind a dimmed scrim so the result still relates to the position just solved;
- underlying board and action-row input must be blocked while the completion overlay is open;
- when another lesson/puzzle follows, completion must offer a direct **Next lesson / Next puzzle** action;
- the final lesson/puzzle must instead provide a clear return to its list;
- Friendly Match checkmate/draw must show a prominent result card with **Play again** and Academy return actions.

### MG-WP6 - Rainbow Disc expansion

**Status: complete / human-approved 2026-10-06.**

Detailed package: `docs/work-packages/MG-WP6-RAINBOW-DISC.md`.

Design contract: `docs/minigames/RAINBOW-DISC-EXPANSION-DESIGN.md`.

Goal: turn Rainbow Disc from a promising activity into a replayable sport game with several distinct ways to play.

Review and expand:

- Match and Practice foundations;
- player/defender scale and alignment;
- aim/timing readability;
- touch drag/throw feel;
- practice-target selection;
- passing/receiving readability;
- scoring/turnover flow;
- replay and result presentation;
- progressive challenge levels;
- target-throw or accuracy challenges;
- passing drills;
- short match variants where useful;
- assistance suitable for younger players without making input feel fake.

World integration remains Rainbow Meadow. The same variants/modes appear through Just Games where context permits.

### MG-WP7 - Pond Leap expansion

**Status: next.**

Goal: deepen the existing timing game without losing its immediate one-touch readability.

Review:

- timing readability;
- touch/keyboard parity;
- difficulty curve;
- frog/course presentation;
- miss/recovery pacing;
- replay value;
- multiple courses/pattern sets;
- progressive challenge levels;
- relaxed/practice and challenge-oriented modes where both add genuine value.

### MG-WP8 - Wobbly Cake expansion

Goal: deepen the accepted baking loop while preserving Maple/picnic progression and keeping Just Games free of world economy side effects.

Review:

- measuring;
- stirring trace feel;
- layering/dragging;
- decorating;
- Wobble Score;
- repeat-bake pacing;
- recipe/challenge variety;
- progressive recipe difficulty;
- creative/free-bake possibilities;
- sandbox mode versus world economy mode.

Do not turn baking into grind, timers or monetisation-style resource pressure.

### MG-WP9 - Firefly Lantern refinement

Firefly Lantern is currently the strongest example of mode/difficulty depth and should be used as a portfolio benchmark, not needlessly rebuilt.

Review:

- mode selection;
- difficulty selection;
- touch precision;
- visual clarity;
- scoring/result feedback;
- retry;
- progression-independent Just Games access;
- whether its current mode structure teaches useful lessons for the other games.

### MG-WP10 - Coral Beachcombing expansion

Goal: increase replay variation and game-like structure while preserving the relaxed beach-search identity.

Review:

- search/readability;
- touch targets;
- environmental feedback;
- scoring/collection feel;
- replay variation;
- result presentation;
- different search lists/challenge sets;
- relaxed exploration versus more structured challenge modes;
- randomisation that improves replayability without making targets unfair or visually obscure.

### MG-WP11 - Cross-game depth and mode review

Goal: ensure the portfolio has enough replayability without mechanically forcing every game into the same design.

For each non-racing current game, explicitly record:

- core loop;
- intended session length/shape;
- current modes/levels;
- difficulty model;
- practice/teaching support;
- replay driver;
- result/retry loop;
- whether another mode would improve the game or merely add menu clutter.

Use Firefly Lantern as a useful comparison point.

The outcome may add small bounded modes to individual games, but substantial redesign discovered here must become a named follow-up package rather than being hidden inside a “consistency” pass.

## Portfolio closeout

### MG-WP12 - Cross-game UX, accessibility and consistency

Goal: make the mini-game portfolio feel intentionally related without making every game visually identical.

Review:

- consistent Back/Retry/Play Again language;
- touch target size;
- keyboard focus/navigation;
- stylus friendliness where drawing/precision is relevant;
- activity title/result hierarchy;
- pause/exit safety;
- reduced-motion/assistance support where relevant;
- audio context and settings;
- small-screen layout;
- no whole-screen shadow/dimming artefacts behind near-full-screen activity shells;
- predictable return to world or catalogue;
- child-readable help that does not become text-heavy.

### MG-WP13 - Mini-game portfolio hardening and release gate

Goal: prove the non-racing mini-game portfolio and platform remain healthy after the refinement programme.

Deliverables:

- full catalogue validation;
- generated/parameterised launch-return coverage for every in-scope catalogue entry;
- world-versus-sandbox side-effect matrix;
- stale registration/helper retirement;
- performance/loading review so optional games stay appropriately lazy;
- final documentation reconciliation;
- human portfolio playtest.

Racing is reported as **deferred to its dedicated overhaul**, not silently treated as accepted by this gate.

Acceptance:

- every in-scope current game family launches from Just Games;
- every world-placed in-scope game still launches from its physical world entry;
- there is one canonical implementation per game;
- refined games have an explicit replay/depth model rather than accidental one-shot behaviour;
- future mini-games still have one documented authoring path;
- no roadmap-specific exception is required simply to expose a game in both contexts.

## Later second-pass expansion

### MG-WP14 - Sunbeam Chess Academy: Advanced Curriculum & Pass-and-Play

Goal: return to the completed Chess Academy after the first portfolio refinement cycle and substantially deepen it without replacing the child-first teaching model established in MG-WP5.

This is a **second-pass expansion**, not unfinished MG-WP5 work.

#### Expanded Lessons

Significantly increase the lesson curriculum beyond the initial foundation set.

Candidate lesson families include:

- piece value and sensible trades;
- protecting pieces and spotting pieces that are hanging;
- opening principles: centre, development and king safety;
- castling and when it is useful;
- simple checkmate patterns;
- forks;
- pins;
- skewers;
- discovered attacks;
- defended versus undefended captures;
- basic pawn structure ideas;
- passed pawns and promotion;
- simple king-and-pawn endings;
- introductory rook endings;
- recognising stalemate and avoiding accidental draws.

Lessons should remain short, visual and interactive rather than becoming a textbook. Advanced concepts may be split into multiple tiny lessons where that is more appropriate for a young player.

#### Expanded Puzzle Garden

Build a substantially larger puzzle library with enough breadth that Puzzle Garden becomes a repeatable practice mode rather than a small demonstration set.

The expanded puzzle system should support:

- themed puzzle groups matching the lesson curriculum;
- multiple puzzles per concept;
- clear beginner / developing difficulty bands;
- mate-in-one and selected mate-in-two puzzles;
- capture, defence and tactical pattern puzzles;
- lightweight progression through a theme without locking unrelated content;
- repeat play and previously-solved markers;
- deterministic legal positions with automated solvability validation;
- enough variation that a child can return regularly without immediately exhausting the set.

Avoid puzzle volume for its own sake: each position should teach or practise a recognisable idea.

#### Pass-and-Play

Add a local **two-human-player** chess mode designed specifically for sharing one tablet.

Requirements:

- White and Black are both controlled by people; no AI opponent is involved;
- use the same real `chess.js` legality, board, move history, check and result handling as the other Chess Academy modes;
- provide an explicit turn handover state suitable for physically passing the tablet;
- clearly show whose turn it is before play resumes;
- consider optional board rotation / orientation switching between White and Black, with the final behaviour chosen through tablet playtesting;
- accidental input during handover must be prevented;
- Restart / New Game / Academy return behaviour must be obvious;
- an unfinished Pass-and-Play game should use the same isolated resumable-session philosophy as Friendly Match and Coach Match;
- no online multiplayer, accounts, matchmaking or network dependency are in scope.

#### Qualification

The second-pass package should include:

- automated legal-position and puzzle-solvability validation;
- curriculum coverage tests;
- Pass-and-Play turn/handover lifecycle coverage;
- resume/restart coverage;
- portrait/tablet touch validation;
- human playtesting with two people physically sharing the same device;
- confirmation that all Chess Academy learning/session state remains isolated from adventure progression.

## Future game idea library

The canonical candidate library is maintained in `docs/minigames/MINI-GAME-IDEA-LIBRARY.md`.

Its purpose is **not** to create a queue of games that must be built from Just Games. It is a shelf of proven or promising mechanics that the main world/release roadmap can draw from when a location, character or story beat naturally calls for a game.

When a candidate is selected by a world package:

1. the world package chooses the fiction/location and creates the first coherent version;
2. it receives a stable MiniGameId and platform integration immediately;
3. its idea-library entry is marked adopted and points to the owning world package;
4. later refinement can return to this MG programme.

## Rules for future roadmap authors

Every future roadmap and bounded work package must apply the following decision:

### If the work does not touch a mini-game

Declare:

`mini_game_platform_impact: none`

No further action is required.

### If the work changes an existing mini-game

Declare:

`mini_game_platform_impact: changed - <mini-game-id>`

The package must preserve both world and Just Games launch contracts and test both if behaviour or lifecycle changed.

### If the work creates a new mini-game in the world

Declare:

`mini_game_platform_impact: new - <mini-game-id> - world-first`

The same package must add the catalogue definition, Just Games exposure and shared launch/session support.

### If the work creates a new mini-game from Just Games

Declare:

`mini_game_platform_impact: new - <mini-game-id> - just-games-first`

The game may be world-unplaced, but must be authored against the same world-capable session/return contract. A later world package should only need to add physical presentation/interaction and call the shared launcher.

## Historical roadmap treatment

Completed historical roadmap entries remain where they are.

For example, Wobbly Cake and Rainbow Disc were legitimately created as part of Sunbeam Village and Rainbow Meadow work. Their history should not be rewritten.

From adoption of this programme onward:

- the main world/release roadmap normally owns **initial game creation, where it exists and why it belongs there**;
- the creating world package must deliver a coherent first playable version and platform integration, including Just Games exposure;
- the Mini-Game roadmap owns the **shared platform and later game-specific improvement/refinement programme**;
- both use the same runtime implementation;
- future mini-game creation must satisfy the global platform contract at first implementation.

## Relationship to other programmes

- Main world/area work can continue independently where it does not alter a mini-game.
- Story House remains its own independent programme.
- Mini-game work must not be used to block unrelated world polish.
- A world package may create/place/narratively integrate a game; the Mini-Game programme may later deepen that existing game's mechanics, modes, teaching and replayability.
- If both programmes need the same game code concurrently, normal Git/package dependency discipline applies; do not create duplicate implementations to avoid a branch conflict.
