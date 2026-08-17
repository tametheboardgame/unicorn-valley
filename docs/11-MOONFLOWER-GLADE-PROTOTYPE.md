# Moonflower Glade Prototype

## Purpose

R1-WP1.2 turns the generic movement test into the first actual explorable location in Unicorn Valley. The map deliberately uses coherent prototype shapes rather than production art so later gameplay work can change layout cheaply.

## Layout contract

The map data lives in `src/game/world/MoonflowerGladeMap.ts` and is the source of truth for stable landmark and entrance IDs.

The prototype contains:

- `moonflower-cottage` as the player's home anchor;
- `garden-plot` beside the cottage;
- `little-bridge` as the only intended stream crossing;
- `display-stump` for future outdoor discoveries;
- `hollow-tree` as the first visible mystery landmark;
- `moonflower-field` as an early discovery/collection location;
- `sunbeam-village` as the reserved east connection;
- `rainbow-meadow` as a reserved south connection.

The entrance markers are visual reservations only in WP1.2. Scene transitions belong to later interaction/world-connection packages.

## Traversal and collision

Arcade Physics uses explicit rectangular collision regions rather than inferring collision from decorative shapes.

The stream is visually continuous, but its collision is split into north and south sections so the bridge gap remains passable. The cottage, hollow tree, display stump and a small number of boulders also block movement.

`MoonflowerGladeMap.test.ts` samples the walkable space and performs a breadth-first traversal check from the player spawn. Every landmark approach point and reserved entrance approach point must remain reachable. The same test also checks that navigation targets are not inside collision geometry.

This is not a replacement for later hands-on collision sweeps, but it catches common prototype-map mistakes before they reach a browser build.

## Visual layering

The prototype follows the art-direction layer model:

1. grass/background colour fields;
2. paths and stream;
3. low decoration;
4. collision landmarks;
5. player;
6. foreground bridge rail and an oversized moonflower;
7. ambient fireflies;
8. fixed HUD.

The foreground bridge rail and giant flower deliberately overlap the player when appropriate. They exist to prove that the world can create a three-quarter layered feel before production sprites arrive.

## Prototype palette

Moonflower Glade follows the agreed regional identity:

- soft green grass;
- lavender/purple flowers and cottage roof;
- cream path/cottage details;
- pale blue stream;
- warm wood bridge;
- gentle yellow firefly accents.

## Diagnostic routes

- normal title flow enters `MoonflowerGladeScene`;
- `?scene=glade` opens the glade directly;
- `?scene=movement-test` preserves the lower-level WP1.1 movement diagnostic;
- `?scene=resize-test` preserves the responsive-canvas diagnostic.

## Follow-on use

R1-WP1.3 should attach interactables to stable landmark/entrance IDs rather than discovering targets from arbitrary display objects. Production art can later replace the shapes without changing the map contract.
