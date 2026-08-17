# R2-WP2.10C - Layering and World-Prop Fix Pass

Status: **Complete**

## Why this pass exists

The first daughter playtest recovery fixed the major input and presentation issues, but a follow-up visual check showed that the player could still appear on top of scenery that should visibly stand in front of her. The original Wonderbook feedback was also clarified: the important problem was the in-world Wonderbook prop on the discovery display, not only the screen shown after opening it.

## Depth and occlusion

The game now uses a simple world-Y depth rule in the current explorable scenes. Objects whose visual base is lower on the screen draw in front of objects that are higher on the screen.

The pass applies that rule to the player and the most important tall scenery in:

- Moonflower Glade;
- Sunbeam Village;
- Moonflower Cottage interior.

Specific fixes include:

- Moonflower Cottage now properly occludes the player when she is behind it;
- boundary tree trunks and canopies sort relative to the player instead of always sitting behind her;
- the Hollow Tree sorts as a tall object;
- bridge rails sort as back and front rails around the player;
- Glade entrance arches and the tall foreground flower sort correctly;
- Pip remains in the same world depth system as the player;
- Village buildings, fountain, NPC markers and entrance structures sort by their visual base;
- overhead village bunting is always foreground so the unicorn passes underneath it;
- major cottage furniture now sorts naturally as the player moves above or below it.

HUD and modal UI remain above world rendering.

## In-world Wonderbook

The discovery display now visibly carries a closed Wonderbook rather than relying on the interaction label to explain what the object is.

The prop has:

- a purple hard cover;
- visible cream page edges;
- a spine and gold clasp;
- moon-and-sparkle cover decoration;
- a slight angle so it reads as an object resting on the display surface.

The open Wonderbook screen remains in place. This pass corrects the specific playtest feedback about recognising the book before it is opened.

## Technical approach

A shared `WorldOcclusionManager` applies depth ordering without duplicating movement logic in each scene. `worldDepthForY()` keeps world objects below the existing HUD depth range while making lower screen positions render progressively further forward.

The approach is intentionally lightweight for the procedural R2 graphics and can later be replaced or extended by sprite-layer metadata as the R3/R6 art pipeline becomes more sophisticated.

## Validation

The pass adds unit coverage for world-depth ordering and must pass the normal repository pipeline:

- formatting;
- lint;
- TypeScript type-check;
- unit tests;
- production build;
- static output smoke test.

## Next package

After this cleanup pass, development proceeds to **R3-WP3.1 - Rainbow Meadow and Race Hub**.
