# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** remains active.

Current bounded package: **MG-WP3 - Just Games Home and Catalogue Experience**

Branch: `agent/mg-wp3-just-games-home-catalogue`

MG-WP3 human gate: **approved 2026-10-03**.

### Completed MG-WP3 scope

- Just Games is available from the title/home screen, including portrait/touch controls;
- `JustGamesScene` is an on-demand feature scene;
- game cards and variants come directly from `MiniGameCatalogue`;
- all seven current game families launch through `MiniGameLauncher` with `source: 'just-games'`;
- every game returns through the shared `MiniGameSession` contract;
- browsing/launching sandbox paths does not require creation of an adventure save;
- Firefly honours the catalogue-selected mode;
- world-specific return labels become **Back to Games** when launched from Just Games;
- the left catalogue uses locked click/keyboard selection with hover-only feedback;
- the variant selector uses a two-column grid and paginates beyond six modes;
- Rainbow Run's five courses render as three clean rows without overlap;
- browser regressions cover sticky selection and non-overlapping race variant geometry;
- scene-key validation was separated from manifest loading to remove the original lazy-load cycle.

### Validation state

The approved preview was manually accepted by David.

The final deterministic Tier 0 failure after that preview was Biome formatting only in the interface/test files. Those exact formatter changes were applied before merge.

The repository performance budget remains red and continues to require separate architecture work; MG-WP3 does not redefine that budget.

## Next work

After MG-WP3 merge:

**MG-WP4 - Future Mini-Game Authoring Kit and Guardrails**

Package:

`docs/work-packages/MG-WP4-AUTHORING-KIT-GUARDRAILS.md`

## Operating reminders

- MG-WP4 must start from the merged MG-WP3 `main`.
- Keep one canonical gameplay implementation per mini-game.
- New games must declare mini-game platform impact and preserve sandbox isolation.
