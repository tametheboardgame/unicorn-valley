---
id: MG-WP5
title: Sunbeam Chess Academy
status: in_progress
autonomy: amber
depends_on: [MG-WP4]
parallel_safe: true
human_gate: playtest
mini_game_platform_impact: changed - sunbeam-chess
---

# MG-WP5 - Sunbeam Chess Academy

## Current checkpoint

**MG-WP5A**, **MG-WP5B** and **MG-WP5C** are complete/human-approved. **MG-WP5D - Coach Match** is the active bounded checkpoint.

Detailed design contract: `docs/minigames/SUNBEAM-CHESS-ACADEMY-DESIGN.md`.

## Objective

Transform the existing Sunbeam Chess activity into a friendly, playful and genuinely useful chess-learning experience for a young child while preserving fully legal chess underneath it.

This is a product redesign of the existing game, not a new chess implementation and not merely an AI difficulty tweak.

## Product principles

- teach through interaction, questions, highlights, puzzles and experimentation rather than lectures;
- mistakes are learning events, not failures;
- winning is not the only success state;
- keep language short and concrete;
- never make the child feel trapped by coaching;
- the teacher can suggest another look but the player retains agency;
- use the real legal-rules engine throughout;
- make the easiest opponent intentionally approachable without making its moves nonsensical;
- preserve one canonical Chess Academy implementation for world and Just Games entry.

## Unicorn teacher

Introduce a warm Unicorn Valley chess-teacher character/presentation.

The character should:

- welcome the player and explain one idea at a time;
- ask guiding questions such as “What can their bishop see?” rather than simply giving the move;
- point to relevant squares/pieces visually;
- congratulate noticing, defending and planning as well as check/checkmate;
- treat losses and blunders as normal;
- avoid interrupting every move.

Name, visual design and exact world fiction remain a human/product decision during implementation.

## Modes

### Lessons

Short interactive lessons and piece-specific micro-games.

Initial progression:

1. board orientation;
2. rook movement;
3. bishop movement;
4. queen movement;
5. king movement and attacked squares;
6. knight movement;
7. pawn movement/captures/promotion;
8. capturing and keeping pieces safe;
9. check;
10. escaping check;
11. checkmate and stalemate;
12. simple mate patterns;
13. piece value and hanging pieces;
14. simple forks/pins;
15. opening principles;
16. basic endgame ideas;
17. castling and en-passant once the fundamentals are comfortable.

The final lesson order may be refined from playtesting. Do not overload the player with every special rule at the beginning.

### Puzzle Garden

Constrained board positions with one clear learning objective.

Examples:

- find a safe capture;
- defend the attacked piece;
- make check;
- escape check;
- find mate in one;
- choose between a hanging piece and a safe piece;
- simple fork;
- simple pin;
- promote a pawn.

Provide immediate, visual explanation after an attempt.

### Coach Match

A full legal game with optional contextual coaching.

Behaviour:

- highlight legal moves only when useful/configured;
- detect obvious beginner-level blunders;
- sometimes ask “Are you sure?” and point at the threat;
- always provide **Play it anyway** as a real choice;
- allow an optional undo in learning mode;
- offer hints as increasingly explicit layers rather than immediately revealing a move;
- do not interrupt reasonable moves just because an engine prefers something else.

### Friendly Match

Ordinary chess with minimal coaching.

Provide several child-readable opponent strengths. Difficulty should change search/decision quality deliberately rather than simply cheating or selecting random illegal/absurd play.

### Challenge positions

Optional later mode for mastered topics if it adds value beyond Puzzle Garden.

## Hint model

Prefer layered hints:

1. **Notice** - identify the relevant area/threat;
2. **Question** - ask what the player can see;
3. **Nudge** - highlight candidate pieces/squares;
4. **Show me** - reveal a strong move when explicitly requested.

Hints should teach *why*, not merely provide notation.

## Progress and persistence

Learning progress may persist only through an isolated mini-game learning-record namespace.

It must not:

- advance adventure quests;
- change relationships;
- grant/consume inventory or Shimmer;
- unlock world progression;
- affect collections.

The same learning record may be available from world and Just Games because it represents chess learning, not adventure state.

If isolated persistence would complicate the first bounded implementation materially, lessons may initially remain available without locking and persistence can be a later named slice.

## Existing world integration

- Sunbeam Village chess plaza remains the physical world wrapper;
- the world interaction opens the same Chess Academy implementation used by Just Games;
- no duplicate “training” scene containing a second chess rules implementation;
- return destination remains session-driven.

## Technical direction

- preserve `chess.js` as the legal-position/rules authority unless implementation evidence requires otherwise;
- separate teaching analysis from legality;
- keep teacher/coaching logic deterministic enough to unit test;
- do not use a full-strength engine recommendation as the definition of “good move” for beginner coaching;
- identify beginner blunders with bounded, explainable heuristics where possible;
- keep optional AI/analysis work off the initial app graph when practical.

## Verification

Automated coverage should include:

- every lesson setup contains a legal/solvable position;
- legal move handling remains correct;
- Coach Match never blocks a legal move permanently;
- “Play it anyway” always works;
- hint levels progress deterministically;
- child-friendly opponent modes always make legal moves;
- world launch/return;
- Just Games launch/return;
- isolated learning progress cannot mutate adventure progression;
- touch/pointer/keyboard board interaction;
- representative portrait/tablet layout.

## Human playtest gate

Do not call MG-WP5 complete based only on automated chess correctness.

Human acceptance should answer:

- can a young beginner understand what the teacher is asking;
- are lessons short enough to remain fun;
- does Coach Match help without nagging;
- does the child feel able to experiment;
- is the easiest opponent beatable without appearing broken;
- are mistakes explained without patronising language;
- does the experience make the child want another lesson/game.

## Non-goals

- online multiplayer;
- competitive ratings/Elo;
- opening-book memorisation;
- tournament clock rules;
- adult-strength chess-engine optimisation;
- adventure rewards for chess learning;
- rebuilding Sunbeam Village itself.


## Bounded delivery checkpoints

- **MG-WP5A - Discovery and design contract - complete**: current implementation audit, teaching principles, mode model, curriculum direction and implementation boundaries.
- **MG-WP5B - Academy shell and teaching foundation - complete / human-approved**: Academy Home, teacher presentation foundation, reusable lesson runner and first piece lessons.
- **MG-WP5C - Puzzle Garden and curriculum expansion - complete / human-approved**: puzzles, layered hints, check/checkmate and piece-safety teaching.
- **MG-WP5D - Coach Match - complete / human-approved**: explainable coaching, another-look/play-anyway flow, undo and layered match hints.
- **MG-WP5E - Friendly Match and opponent ladder - complete / merged**: child-friendly opponent levels, rematch/result flow and match polish.
- **MG-WP5F - Learning records, responsive polish and human playtest - active**: isolated learning persistence, final world/Just Games reconciliation, responsive/accessibility qualification and acceptance.

Do not chain these slices into one autonomous implementation window.


## MG-WP5B implementation record

Implemented:

- Academy Home is now the default entry for `sunbeam-chess`;
- the Academy visibly presents Lessons, Puzzle Garden, Coach Match and Friendly Match;
- Puzzle Garden and Coach Match are deliberately marked unavailable until their own bounded slices;
- Friendly Match preserves the previous full legal-chess experience rather than removing existing functionality;
- a visible Sunbeam Chess Coach unicorn presentation is established without yet locking a final name/world biography;
- Lessons provides a reusable lesson runner over real `chess.js` positions;
- the first four lessons are Rook Rays, Bishop Trails, Knight Jumps and Pawn Steps;
- lesson goals are shown directly on the board and legal destinations remain visible;
- incorrect but legal lesson moves are acknowledged positively, then reset for another attempt;
- the four-stage hint philosophy is implemented for lessons: Notice -> Question -> Nudge -> Show me;
- starter lesson definitions are unit-validated as legal and solvable;
- browser coverage exercises Academy Home, unavailable future modes, a real completed rook lesson and preservation of Friendly Match.

Out of scope for WP5B:

- Puzzle Garden content;
- Coach Match intervention logic;
- Friendly Match difficulty ladder;
- learner persistence;
- final teacher identity/portrait polish.


## MG-WP5B human acceptance

David approved the WP5B Academy shell and starter lesson experience on 2026-10-04 after testing the Cloudflare branch preview.

This approval covered the visual/product checkpoint for WP5B. The accepted checkpoint subsequently passed exact-head CI and merged to `main`.


## MG-WP5C implementation record

Implemented on the child branch so far:

- Puzzle Garden is now an available Academy mode;
- starter puzzle families cover a free capture, giving check, escaping check and mate in one;
- every puzzle is defined as a real legal `chess.js` position with an authored legal solution;
- puzzle validation verifies check / escape-check / mate semantics where relevant;
- Puzzle Garden uses the same Notice -> Question -> Nudge -> Show me hint ladder;
- legal-but-not-solution moves are acknowledged as real chess moves before the position resets;
- the Lessons curriculum now extends beyond movement into captures, check, escaping check and checkmate;
- the lesson list scales to eight current lessons;
- focused browser coverage now includes solving mate in one through the real board.

MG-WP5C deliberately does not implement Coach Match, opponent difficulty levels or learner persistence.


## MG-WP5C visual-polish implementation

Human review of the first Puzzle Garden preview approved the puzzle functionality but rejected the placeholder coach portrait, cramped bottom navigation and dull beige/green Academy presentation.

Implemented against the roadmap brief:

- replaced the original malformed side-profile coach badge with a cleaner three-quarter/front unicorn teacher portrait using one horn, one readable ear, separated mane colours, a clear eye/muzzle and an academy collar/medallion;
- established a single `CHESS_ACADEMY_PALETTE` for the non-board interface;
- changed the Academy outer field to deep royal violet;
- changed the main shell to pale lilac with a gold rim and a strong violet header treatment;
- gave Lessons, Puzzle Garden and Friendly Match distinct berry / mint / lavender accent treatments;
- converted lesson, puzzle and match information panels from beige to pale lilac, mint and white surfaces;
- brightened action buttons to mint/turquoise with violet outlines;
- retained the existing classic chess-board colours as the stable visual anchor;
- moved Home, Lessons and Puzzle Garden navigation controls into a dedicated bottom safe area;
- all bottom action rows now sit at logical y=638 with a 52 px control height inside a shell ending at y=696, leaving a 32 px bottom inset;
- compacted the eight-lesson selector so its final row ends well above the action row;
- moved Puzzle Garden cards upward and reduced their height slightly to preserve the same safe area;
- increased breathing room in the teacher/intro bands.

WP5C remains human-gated for visual acceptance before MG-WP5D.


## MG-WP5C second human-polish pass

Follow-up review of the brightened Academy UI identified two remaining presentation issues and one missing interaction affordance.

Implemented:

- replaced the custom-drawn teacher badge with the existing production NPC/unicorn art pipeline using the happy portrait presentation, retaining a small Academy frame/medallion treatment;
- moved all eight lesson rows downward so the first row begins below the teacher/intro band rather than intersecting the portrait;
- kept the portrait and intro band visually separate from selectable lesson cards;
- added a large celebratory completion card for lessons and puzzles;
- added **Next lesson** / **Next puzzle** when another authored item follows;
- the final lesson/puzzle returns to the relevant list rather than offering a nonexistent next item;
- Friendly Match now receives an explicit game-result card for win/loss/draw, with **Play again** and Academy return controls;
- completion controls are named in diagnostics and covered by browser regression tests;
- browser coverage now proves that Rook Rays advances directly to Bishop Trails and the first Puzzle Garden challenge advances directly to the second puzzle.


## MG-WP5C completion overlay refinement

Follow-up human review approved the clearer completion state but requested that it read as a true end-state over the whole activity rather than another right-side card.

Implemented:

- completion now uses a centred 1000 x 500 modal spanning roughly 80% of the board + teaching content area;
- the underlying completed board and instructions remain visible behind a violet scrim for context;
- the scrim intercepts pointer input so the chess board and normal bottom action row cannot be used while the result modal is open;
- Lesson / Puzzle Next and list-return actions are centred inside the modal;
- Friendly Match uses the same full-activity result treatment.


## MG-WP5C human acceptance

David approved the final WP5C Puzzle Garden / curriculum / visual-completion experience on 2026-10-05 after testing the branch preview, including the full-width completion overlay.

MG-WP5C is product-approved. Merge remains subject only to exact-head repository validation and branch reconciliation.


## MG-WP5D implementation record

Current bounded Coach Match implementation:

- Coach Match is now available from Academy Home and uses the same canonical chess scene/rules engine as Friendly Match;
- coaching analysis lives in `SunbeamChessCoach.ts`, separate from Phaser presentation and from move legality;
- the coach only interrupts for bounded, explainable beginner situations:
  - allowing an immediate mate-in-one against the player;
  - hanging a rook/queen to a much cheaper piece;
  - overlooking a safe free rook/queen capture;
- ordinary reasonable moves are not interrupted merely because another move scores better;
- every warning offers both **Have another look** and **Play it anyway**;
- Coach Match supports layered hints: Notice -> Question -> Nudge -> Show me;
- Coach Match supports undo of the player's move plus the village reply as one learning turn;
- the existing village opponent remains in use for this slice; dedicated opponent difficulty work remains MG-WP5E;
- unit coverage exercises explainable coaching decisions and layered hints;
- browser coverage exercises Coach Match availability, a normal opening move, the village reply and full-turn undo.

MG-WP5D remains human-gated before moving to MG-WP5E.


## MG-WP5D Coach Match interaction-polish pass

Human review of the initial Coach Match preview identified three issues:

1. the right column reads as stacked UI panels rather than a coach speaking to the player;
2. the village replies ~520 ms after the player's move, replacing the player's feedback before it can be read;
3. the three-line move log has no clear navigation and becomes unreadable as a match grows.

Implementation contract:

- rebuild the Coach Match upper-right area around the production-art coach portrait and one speech bubble with a visible tail toward the coach;
- merge turn/status guidance into the conversational area rather than retaining separate competing note/status boxes;
- hold the player's coaching response for ~2.2 seconds before triggering the automatic village move;
- leave the village-move explanation visible until the next player interaction;
- introduce one shared move-history renderer for Coach Match and Friendly Match;
- display four full-move rows at a time with touch-friendly up/down controls;
- display the current visible move range / total count;
- auto-follow the newest moves after a new move, while explicit scrolling allows browsing earlier moves;
- preserve all existing Coach Match warning, hint, undo and Play-it-anyway behaviour.


## MG-WP5D interaction-polish implementation

Implemented from the Coach Match human-preview feedback:

- rebuilt the Coach Match right column around the production-art coach portrait and a single speech bubble with a visible tail toward the coach;
- removed the competing stacked status / coach-note rectangles from Coach Match;
- player-move feedback is held for 2.4 seconds before the automated village reply starts;
- the subsequent village reply is appended to the player's previous coaching text instead of immediately erasing it;
- introduced one shared four-row move-history renderer used by both Coach Match and Friendly Match;
- history now uses aligned White / Village columns, a visible current-range indicator, and touch-friendly up/down buttons;
- move history follows the newest move by default but manual scrolling can browse earlier full moves;
- Friendly Match receives the same history navigation and automatically returns to the newest row after new play;
- browser coverage verifies the speech bubble, readable feedback hold, preserved player + village response, history range, shared scroll controls and Coach Match undo.


## MG-WP5D human acceptance and merge

David approved the completed Coach Match experience on 2026-10-05, including the conversational coach bubble, readable response pacing, scrollable shared move history and checked-king warning treatment.

MG-WP5D subsequently merged to `main` as `0da50c38c9643001477b36724ab5a3877ec5b2bb`.

## MG-WP5E implementation contract

WP5E now owns Friendly Match depth and opponent choice.

The approved WP5A design already defines the initial opponent ladder:

- **Dandelion** — very forgiving;
- **Clover** — beginner;
- **Sunbeam** — developing player.

Implementation rules for this slice:

- all three opponents use real legal `chess.js` moves;
- difficulty is created by bounded move-choice quality, not cheating, illegal moves or arbitrary board edits;
- easier levels make plausible beginner choices rather than random nonsense;
- move selection remains deterministic enough for unit/browser validation;
- Friendly Match must present opponent choice before a new match;
- rematch keeps the selected opponent;
- result flow must offer a direct rematch, opponent change and Academy return;
- the current shared move-history/check/highlight behaviour remains intact;
- selected difficulty remains session-local in WP5E; isolated persistence belongs to WP5F.


## MG-WP5E first implementation slice

Implemented:

- Friendly Match now opens an opponent-selection screen instead of immediately starting the old fixed match;
- the approved ladder is live:
  - **Dandelion** — very forgiving;
  - **Clover** — beginner;
  - **Sunbeam** — developing player;
- opponent policy is isolated in `SunbeamChessOpponent.ts`;
- all levels choose only legal `chess.js` moves;
- difficulty is deterministic and created by ranked move-choice quality rather than illegal play, cheating or random board manipulation;
- Dandelion deliberately chooses further down the plausible ranked move list;
- Clover normally chooses the strongest candidate but periodically selects the second-ranked plan;
- Sunbeam uses the strongest existing shallow heuristic;
- the legacy village/teaching move helper now routes through the same Sunbeam opponent policy rather than carrying a duplicate scorer;
- Friendly Match displays the selected opponent name/identity throughout the match;
- Restart/rematch preserves the chosen opponent;
- the in-match **Opponents** control returns to the ladder without leaving Chess Academy;
- Friendly Match results offer **Rematch**, **Change opponent** and **Academy**;
- unit coverage verifies ladder definitions, legal moves, determinism, relative ranked move quality and no-move behaviour;
- browser coverage verifies all three opponent cards are interactive and that selecting Dandelion starts the canonical full chess match with Dandelion carried into the match UI.

This remains a human-gated WP5E checkpoint. Further tuning should react to actual play feel rather than making the easiest opponent arbitrarily worse.


## MG-WP5E merge record

MG-WP5E merged to `main` on 2026-10-05 as `1b10399daf67076326238db1b0790812c926f129`.

The merged Friendly Match experience provides Dandelion, Clover and Sunbeam opponent levels, deterministic legal move selection, opponent selection/rematch flow and shared match-history presentation.

## MG-WP5F implementation contract

WP5F is the final Chess Academy qualification checkpoint.

Learning records are implemented as a **separate versioned browser-storage namespace**, `unicorn-valley.learning.sunbeam-chess.v1`, rather than adding chess state to the adventure `SaveGame`.

Permitted persisted data in this namespace:

- completed lesson IDs;
- completed puzzle IDs;
- per-puzzle solve counts;
- last selected Friendly Match opponent.

The learning record must never:

- advance or gate quests;
- mutate relationships;
- grant or consume inventory or Shimmer;
- alter world/story flags;
- unlock collections or locations;
- make lessons, puzzles or opponent levels inaccessible.

Storage failure or corrupt learning data must fail soft to an empty/default learning record and must never block Chess Academy play.

Responsive/accessibility qualification for WP5F:

- retain Phaser's canonical 1280×720 logical canvas with `FIT` scaling rather than adding a second layout/scaling system;
- prove the Academy canvas remains contained in a representative portrait/tablet viewport;
- retain touch/pointer hit targets and enlarge undersized move-history controls to at least 44 px high;
- add keyboard-only Academy navigation through numbered choices;
- add arrow-key board focus plus Enter/Space selection;
- make keyboard focus and controls visibly discoverable.

Final automated qualification must cover the isolated learning namespace, completion restoration/display, keyboard-only play and portrait/tablet containment.

Final human acceptance remains mandatory. The playtest should judge the complete Academy as a child experience: lesson clarity, Puzzle Garden comprehension, Coach Match helpfulness, Dandelion beatability without absurd play, Friendly Match replay flow, touch/keyboard usability, and whether the child wants to keep playing.


## MG-WP5F human-playtest follow-up — Friendly Match continuity

Human review found the overall WP5F preview strong, but the Friendly Match memory contract was not sufficient. Remembering only the last opponent does not make an unfinished chess game feel continuous.

Accepted follow-up behaviour:

- an unfinished Friendly Match is persisted inside the isolated Chess Academy learning namespace;
- the saved session uses PGN so board state, legal-move context and move history restore together;
- returning to Friendly Match with an unfinished game presents:
  - **Carry on previous game**;
  - **Start a new game**;
- Carry on restores the same opponent, board position and move history;
- if the saved position has Black to move, the opponent continues normally after restore;
- Start a new game explicitly replaces the old unfinished game and returns to opponent selection;
- Restart replaces the saved game with a fresh game against the same opponent;
- a completed game is removed from the resumable-session slot;
- the preferred/last-played opponent remains visibly identified on the opponent selector;
- corrupt, illegal or completed stored PGN is discarded safely rather than blocking play;
- the resumable game remains learning/practice data only and has no adventure progression coupling.

Automated qualification must prove the session survives leaving Chess Academy back to Just Games and re-entering the chess scene before resuming.


## MG-WP5F human-playtest follow-up — Coach Match continuity

The same continuity principle now applies to Coach Match.

Accepted behaviour:

- an unfinished Coach Match is persisted in the isolated Chess Academy learning namespace;
- returning to Coach Match offers:
  - **Carry on previous coached game**;
  - **Start a new coached game**;
- Carry on restores the board and move history from the last committed legal position;
- transient coaching presentation state is deliberately not persisted:
  - an open “Have another look / Play it anyway” prompt;
  - current hint stage;
  - temporary coach feedback timing;
- if the saved position is waiting for the village reply, resuming safely completes that reply;
- Undo updates the persisted coached-game position;
- Start a new coached game replaces the previous unfinished game;
- a completed coached game is removed from the resumable-session slot;
- the resumed Coach Match remains isolated learning/practice state and cannot affect adventure progression.

Automated qualification must prove the coached game survives leaving Chess Academy back to Just Games and re-entering before resuming.


## MG-WP5F final human acceptance

David approved the completed WP5F Chess Academy experience on 2026-10-06 after testing the learning records, responsive presentation, Friendly Match continuity and Coach Match continuity in the Cloudflare branch preview.

This closes the human-playtest gate for MG-WP5.

Accepted final package state:

- Lessons and Puzzle Garden are complete and replayable;
- Coach Match provides explainable beginner coaching without permanently blocking legal moves;
- Friendly Match provides the Dandelion / Clover / Sunbeam opponent ladder;
- completed lessons and puzzles persist only in the isolated Chess Academy learning namespace;
- unfinished Friendly Match and Coach Match games can be resumed after leaving and re-entering Chess Academy;
- resumable match state does not mutate or gate adventure progression;
- touch/pointer and keyboard play remain supported;
- representative portrait/tablet containment is covered;
- the package is ready to merge and MG-WP5 is complete after that merge.

The next mini-game refinement package is **MG-WP6 — Rainbow Disc**.
