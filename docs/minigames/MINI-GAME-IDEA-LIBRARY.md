# Mini-Game Idea Library

This is the canonical shelf of candidate embedded-game ideas for Unicorn Valley.

It is deliberately **not** an implementation queue.

New games normally originate in the main world/release roadmap when a location, character, story beat or environment creates a natural reason for the activity to exist. The world package then creates the first coherent version under the shared mini-game platform. The independent MG programme can later deepen that existing game.

## Entry states

- **idea** - worth retaining, no world placement chosen;
- **candidate** - likely fit identified, not yet authorised for implementation;
- **adopted** - selected by a main-roadmap package; link that package here;
- **implemented** - canonical game exists in the catalogue;
- **retired** - deliberately rejected/superseded.

## Traditional strategy games

### Morris family

Status: **idea**

Treat Morris as one player-recognisable game family rather than four unrelated catalogue cards.

Candidate variants:

- Three Men's Morris;
- Six Men's Morris;
- Nine Men's Morris;
- Twelve Men's Morris.

Product direction:

- introduce variants progressively from simpler to richer boards;
- teach mills, blocking and movement through play;
- use an original Unicorn Valley physical-board presentation;
- child-friendly hints and optional move highlighting;
- world placement should be chosen by a future main-roadmap location rather than invented here merely to justify the game.

Architecture note: if implemented, prefer one stable family ID with variants unless implementation evidence shows the rulesets need genuinely separate game families.

### Hnefatafl / Tafl

Status: **idea**

An asymmetrical strategy game based on the historical tafl family: one side protects/escorts a king while the opposing side attacks with a larger force.

Notes:

- this is historically distinct from chess rather than a direct Viking precursor to chess;
- asymmetry could make it especially useful beside the symmetric games already planned;
- teach the unusual win conditions visually and incrementally;
- use an original Unicorn Valley theme/presentation rather than presenting it as a museum recreation unless a future world location specifically calls for that.

## Drawing / stylus games

### Spell Tracing / Glyph Casting

Status: **idea**

Inspiration reference: **Divineko - Magic Cat** uses a fast loop in which the player draws symbols matching incoming threats to cast spells. Unicorn Valley should take inspiration from the tactile draw-to-act mechanic, not copy its characters, art, symbols, progression or combat fiction.

Potential Unicorn Valley direction:

- draw magical glyphs, constellations, runes, plant shapes, weather marks or other world-specific symbols;
- finger and stylus are both first-class inputs;
- generous path tolerance for a young player;
- clear visual tracing feedback showing where the stroke matched or wandered;
- relaxed practice mode before any timed/challenge mode;
- later difficulty can combine or sequence strokes rather than merely shrinking tolerance;
- mistakes should invite retry rather than punish the player harshly;
- handwriting-adjacent variants could use selected letters/numbers/forms where educationally useful, but the game should remain fun rather than becoming a handwriting test;
- avoid requiring speed before shape confidence is established.

Possible mode family:

- Learn/Trace;
- Spell Practice;
- Pattern Waves;
- precision challenge;
- optional timed/endless variant after mastery.

World placement: deliberately unassigned. Pull this idea into the main roadmap when a magical teacher, school, spell location, ancient inscription or similar world context makes it belong.

## Original-game intake rule

When David says a location “should have a mini-game”, check this library before inventing a new mechanic from scratch.

A candidate is useful only when it fits the place. Do not force a stored game idea into a world area just because it is available.

When a new idea comes up in conversation:

1. record the mechanic in this library;
2. note any obvious age/input/accessibility considerations;
3. leave world placement unassigned unless the main-roadmap context already supplies it;
4. if adopted, point the entry at the owning world package and use that package's `mini_game_platform_impact: new - <id> - world-first` declaration.
