# Sunbeam Village Prototype

## Purpose

R2-WP2.1 adds Sunbeam Village as the first social hub outside Moonflower Glade. The prototype establishes the spatial layout and travel behaviour needed by later R2 quests, friendship, inventory and shop work without prematurely implementing those systems.

## Layout

Sunbeam Village uses a warm, colourful storybook layout centred on a broad village square and Sunbeam Fountain.

The first building exteriors are:

- Sunbeam Bakery;
- Twinkle & Thread accessory shop;
- Story House library.

Each building has a clear approach point and a lightweight exterior interaction. The interiors remain deliberately closed until later packages need them.

## Connections

The west path connects directly to Moonflower Glade. Leaving the village returns the player to the Glade's village entrance rather than the default cottage spawn.

The east path visibly reserves the Rainbow Meadow connection. The gate can be approached and inspected, but the meadow remains closed until its later release work.

Entering and leaving the village updates the saved current location. Returning to the title screen and choosing Continue therefore resumes in Sunbeam Village when that was the last active zone.

## NPC space

The square reserves four separated NPC positions, including Willow's first stable village marker. The remaining markers are intentionally generic so later NPC work can assign characters without having to redesign the hub.

The marker spacing is validated to keep future interaction radii from becoming visually or mechanically crowded.

## Validation

`SunbeamVillageMap.test.ts` checks that:

- the player spawn is valid and collision-free;
- every building approach, entrance and NPC marker is reachable;
- NPC markers keep enough separation for distinct interactions;
- landmark, entrance and marker IDs remain unique.

The normal repository CI additionally checks formatting, linting, TypeScript, unit tests, production build and static output.
