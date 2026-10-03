# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP3 - Just Games Home and Catalogue Experience**

Branch: `agent/mg-wp3-just-games-home-catalogue`

MG-WP2 is complete, human-approved and merged to `main` as `66f05c6a5279cafb6df4e938c721759d0744e898`.

### Current checkpoint - MG-WP3A

The first visible Just Games platform slice is implemented:

- **Just Games** appears on the title menu;
- the title entry is available even when adventure storage is unavailable or a newer save blocks adventure loading;
- portrait/touch title controls expose the same action;
- `JustGamesScene` is an on-demand `SceneManifest` feature;
- game cards are generated directly from `MiniGameCatalogue`;
- the scene shows all seven current catalogue families;
- variant controls are generated from catalogue variants rather than a second hard-coded game list;
- Up/Down chooses a game, Left/Right chooses a variant, Enter/Space plays and Escape returns Home;
- touch/card/variant/Play controls use the shared UI primitives;
- launches use `MiniGameLauncher` with `source: 'just-games'`;
- every launch returns to the paused `JustGamesScene` through `MiniGameSession`;
- no adventure save is required merely to browse the catalogue.

Browser contract added:

`tests/play/mg-wp3-just-games.spec.ts`

It proves:

- the title opens Just Games;
- all seven catalogue cards are present;
- entering Just Games with no save does not create one;
- Sunbeam Chess launches/returns through sandbox without creating a save;
- Rainbow Disc Practice launches through the selected catalogue variant and returns;
- Escape returns from Just Games to the title.

Verification ownership now maps `JustGamesScene` and the new browser contract to the mini-games verification group.

## Next work

1. validate and close MG-WP3A;
2. MG-WP3B - launch/return contract across every current catalogue family;
3. MG-WP3C - responsive/touch/readability polish and result/return copy audit;
4. MG-WP3D - final human-gate hardening and closeout.

After MG-WP3 approval and merge:

**MG-WP4 - Future Mini-Game Authoring Kit and Guardrails**

Package:

`docs/work-packages/MG-WP4-AUTHORING-KIT-GUARDRAILS.md`

## Human gate

MG-WP3 is Amber. Do not merge until every catalogue-visible current game launches, retries where applicable and returns safely from the exact Just Games preview, and David approves the catalogue experience.
