# Unicorn Valley - Art and Audio Direction

## Art goal

Unicorn Valley should look like an illustrated storybook that has become playable.

The target is not realistic 3D and not generic flat educational-game graphics. The world should feel lush, colourful, soft-edged and deliberately magical while remaining readable during play.

## Visual perspective

Main world:

- 2D/2.5D three-quarter perspective;
- layered scenery to create depth;
- large expressive character sprites;
- foreground objects that can overlap the player;
- gentle environmental animation.

Racing:

- dedicated side-scrolling or pseudo-2.5D presentation;
- larger character animation than the overworld;
- strong sense of speed through background layers, particles and sound.

## Visual principles

### Readability before decoration

A beautiful screen that hides the player or interaction point is a failure.

Maintain clear separation between:

- walkable ground;
- obstacles;
- interactive objects;
- foreground decoration;
- UI.

### Large shapes

Use bold silhouettes rather than intricate tiny detail.

This helps:

- child readability;
- lower-resolution displays;
- animation consistency;
- future asset production.

### Controlled colour

Every region can be colourful without using every colour equally.

Each region should have:

- dominant palette;
- secondary palette;
- accent colour;
- signature environmental effect.

Example:

Moonflower Glade:

- dominant: soft greens and lavender;
- secondary: cream and pale blue;
- accent: glowing pink-purple moonflowers;
- effect: drifting fireflies/sparkles.

Sunbeam Village:

- dominant: warm yellow, peach and green;
- secondary: turquoise and cream;
- accent: bright bunting colours;
- effect: butterflies, flags and chimney wisps.

Whispering Woods:

- dominant: teal and deep green;
- secondary: indigo;
- accent: luminous mushrooms and flowers;
- effect: floating motes and moving shafts of light.

## Unicorn visual design

The player unicorn needs to support modular customisation.

Sprite construction should account for separate or compositable layers where practical:

- body;
- markings;
- eyes/face detail;
- mane;
- tail;
- horn;
- wings later;
- accessories;
- shadow/effects.

The exact pipeline may use pre-rendered combinations or runtime tint/layers depending on performance and consistency testing.

## Character proportions

Aim for:

- large head and expressive eyes;
- short-to-medium body proportions;
- readable legs and hooves;
- mane/tail shapes that create strong silhouettes;
- clearly visible horn;
- enough body area for markings.

Avoid directly mimicking the proportions or line language of an existing unicorn/pony franchise.

## Expression set

Main NPCs should eventually support at least:

- neutral;
- happy;
- excited;
- surprised;
- thinking;
- worried/sad but gentle;
- determined.

Expression can initially be portrait-based even if overworld sprites use fewer animations.

## Overworld animation set

Minimum player/NPC set for polished movement:

- idle;
- walk/run in required directions;
- interaction/reaction;
- happy/celebrate.

Later:

- sit/rest;
- sniff/investigate;
- magic use;
- sleep;
- special character-specific idles.

## Race animation set

Racing will require dedicated animation quality because the unicorn is large on screen.

Minimum:

- gallop;
- jump rise;
- jump fall/landing;
- stumble/slow reaction;
- boost/sprint;
- finish celebration.

## Environment layers

A region can use layers such as:

1. distant background;
2. ground/tiles;
3. low decoration;
4. collision props;
5. characters/interactables;
6. foreground foliage/arches;
7. particles/light effects;
8. UI.

Layering should create depth without relying on real 3D.

## Environmental motion

Small ambient animations are disproportionately valuable for making a static map feel alive.

Examples:

- flowers sway;
- butterflies wander;
- banners flutter;
- water glints;
- tree leaves move;
- chimney smoke drifts;
- sparkles pulse;
- fireflies blink;
- clouds move slowly.

These should be lightweight and not make the screen visually frantic.

## UI visual language

UI should feel like part of the storybook world while remaining very clear.

Possible motifs:

- rounded cards;
- stitched/ribbon tabs;
- flower/star icons;
- soft shadows;
- large illustrated buttons;
- sticker-like Wonderbook entries.

Avoid:

- tiny text;
- thin low-contrast outlines;
- complex nested panels;
- desktop productivity-app styling.

## Wonderbook visual identity

The Wonderbook should be one of the most visually distinctive interfaces.

Presentation ideas:

- page-turn transition;
- stickers appearing when discoveries unlock;
- illustrated silhouettes for undiscovered entries;
- ribbon/bookmark category tabs;
- handwritten-feeling headings paired with highly readable body text;
- small animated doodles.

It should feel like a scrapbook of the player's adventures, not an achievement dashboard.

## Cottage art direction

The cottage should feel unusually personal compared with public spaces.

Key visual qualities:

- cosy scale;
- warm lighting;
- clearly visible decoration slots;
- enough uncluttered space for player-chosen items;
- visible shelves/displays for discoveries.

Decoration sets can have themes:

- Moonflower;
- Rainbow;
- Starry Night;
- Woodland;
- Seaside;
- Racer;
- Baking;
- Winter.

## Asset development strategy

Development should use staged asset quality rather than waiting for final art before mechanics exist.

### Stage 1 - functional placeholder

- coloured shapes;
- simple generated icons;
- basic player silhouette;
- temporary tile colours;
- enough differentiation to test systems.

### Stage 2 - coherent prototype art

- consistent storybook palette;
- recognisable temporary unicorn sprites;
- basic environment set;
- first-pass UI skin.

### Stage 3 - production art pass

- polished modular player art;
- final NPC designs;
- region-specific environment assets;
- effects and animation;
- complete UI illustration.

### Stage 4 - polish pass

- ambient animations;
- transitions;
- particles;
- lighting overlays;
- contextual reactions;
- decorative variants.

This reduces the risk of building beautiful assets for a mechanic that later changes.

## Asset consistency rules

Before an asset is treated as production-ready, check:

- perspective matches the region;
- light direction is compatible;
- outline/edge treatment matches neighbouring art;
- scale relative to character is correct;
- transparency is clean;
- palette is consistent;
- interactive object remains readable;
- asset does not resemble protected character/property design too closely.

## Audio goal

Audio should make the valley feel alive even when the player is standing still.

The soundtrack should be melodic, whimsical and calm enough for repeat listening.

## Music structure

Each major region should eventually have its own musical identity.

Suggested direction:

### Moonflower Glade

- gentle celesta/piano;
- soft strings;
- light bells;
- calm home feeling.

### Sunbeam Village

- plucked strings;
- light woodwind;
- playful percussion;
- cheerful but not frantic.

### Rainbow Meadow

- open, bright melody;
- acoustic/light orchestral texture;
- sense of movement.

### Whispering Woods

- soft marimba/celesta;
- airy pads;
- tiny bell-like details;
- mysterious without tension.

### Racing

- faster tempo;
- clear rhythmic pulse;
- playful orchestral/pop energy;
- dynamic finish sting.

## Musical repetition rules

Because browser game sessions can repeat the same area:

- loops need clean musical endpoints;
- avoid extremely short repetitive melodies;
- favour pieces with internal variation;
- fade between location tracks where practical;
- allow music to stay off without impairing gameplay.

## Sound effects

Important SFX categories:

- UI select/back;
- item collect;
- rare discovery;
- Wonderbook entry;
- quest progress;
- friendship moment;
- footsteps/hoofbeats;
- water/grass interactions;
- door/transition;
- race countdown;
- jump;
- boost;
- obstacle impact;
- finish;
- decoration placement.

## Character vocalisation

Full voice acting is not required.

A strong alternative is short non-verbal character chirps/reactions paired with text, similar to expressive game vocalisations:

- greeting;
- happy;
- surprised;
- thinking;
- worried;
- celebration.

Each main NPC should eventually have a recognisable sound personality.

## Ambience

Region ambience may include:

- birds;
- wind;
- water;
- insects;
- distant village activity;
- soft magical tones;
- beach waves later.

Ambience should sit beneath music rather than compete with it.

## Audio accessibility

- separate music/effects controls;
- visual feedback for anything gameplay-critical;
- no required sound-only puzzle in initial releases;
- sudden loud sounds should be avoided.

## Production priority

When deciding between additional decorative art and interaction feedback, prioritise:

1. player readability;
2. interaction readability;
3. character expression;
4. world identity;
5. ambient polish.

The game should feel responsive and understandable before it becomes visually dense.
