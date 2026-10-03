# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP1 - Existing Game Migration to One Launch Contract**

Branch: `agent/mg-wp1-existing-game-migration`

MG-WP0 is complete, human-approved and merged to `main` as `dc24989ebec4261301dd521da2d8e9a9ac91f17e`.

### Current checkpoint - MG-WP1A

The first bounded migration slice owns:

- Rainbow Disc;
- Pond Leap;
- Sunbeam Chess.

Implemented so far:

- Rainbow Meadow launches Match/Practice through `MiniGameLauncher`;
- Meadow Pond Leap launches through `MiniGameLauncher` while preserving reflection scene data;
- Sunbeam Chess launches through `MiniGameLauncher` without the world manager importing/registering the scene class;
- all three gameplay scenes read the normalised `MiniGameSession` and use the shared return boundary;
- obsolete Rainbow Disc and Pond Leap registration helpers are retired.

No gameplay rules, world coordinates, quest progression or reward behaviour have intentionally changed.

## Next work

Continue MG-WP1 in bounded checkpoints:

1. validate and close MG-WP1A;
2. MG-WP1B - Wobbly Cake launch migration;
3. MG-WP1C - Coral Beachcombing migration;
4. MG-WP1D - Firefly Lantern migration;
5. MG-WP1E - Rainbow Run Racing migration;
6. MG-WP1F - stale-path audit and package closeout.

MG-WP2 sandbox/persistence isolation does not begin until MG-WP1 is approved and merged.

## Validation state

Current MG-WP1 branch validation is pending.

The inherited first-playable performance budget on main remains slightly above its existing 560 KiB threshold; treat it as baseline unless MG-WP1 materially worsens it.

## Human gate

MG-WP1 is Amber. Do not merge until all seven current game families have been migrated, MG-caused failures are resolved and David approves the package.

## Operating reminders

- Use bounded checkpoints; do not chain the whole migration without reporting meaningful state.
- On deterministic current-work CI failure, inspect and fix immediately.
- If Git/GitHub access fails, reconnect before reporting a blocker.
- Do not duplicate mini-game implementations or scene registries.
