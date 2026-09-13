# H0H performance architecture

## Purpose

H0H replaces the inherited total-JavaScript breadth ceiling with player-visible loading budgets while retaining the old metric as trend evidence. It does not increase the legacy 650 KiB figure and does not treat optional game breadth as startup cost.

## Measured H0A baseline

Source checkpoint: `97167f6b78913c16012f636b5733d04e3e7bff41`.

- Entry: 471,915 raw bytes / 126,296 gzip bytes.
- Initial/title/first-playable static graph: 1,976,435 raw bytes / 523,453 gzip bytes.
- Total JavaScript: 2,363,797 raw bytes / 666,008 gzip bytes.
- JavaScript chunks: 81.
- Largest optional feature chunks were about 8 KiB gzip; Phaser was the dominant initial vendor chunk at 355,968 gzip bytes.
- Browser diagnostics were already emitted on demand rather than referenced by initial HTML.

The old 650 KiB total-JS rule therefore failed by 408 bytes even though the player-visible entry and first-playable graph remained materially below their respective practical ceilings. H0C-G then added engineering/test infrastructure, making total breadth an even poorer proxy for startup cost.

## Reviewed H0H policy

The implemented policy in `scripts/performance/performancePolicy.mjs` distinguishes:

1. Entry JavaScript: hard limit remains 520 KiB raw. This preserves the existing player-facing entry guard rather than raising it.
2. Initial/title/first-playable static graph: hard limit 560 KiB gzip. The H0A baseline was about 511 KiB gzip, leaving roughly 49 KiB (about 9.5%) deliberate headroom.
3. Largest lazy JavaScript chunk: hard limit 32 KiB gzip. H0A optional feature chunks were roughly 8 KiB gzip, so this allows sensible feature growth while preventing an accidentally monolithic lazy feature.
4. JavaScript chunk count: hard limit 112. H0A emitted 81 chunks, leaving expansion headroom while guarding against tiny-chunk request storms.
5. Browser diagnostics: hard rule that the diagnostics chunk must not enter the initial static graph.
6. Total emitted JavaScript: reported in raw/gzip form and compared with the historical 650 KiB metric, but no longer an arbitrary permanent maximum for game breadth.

These thresholds are intentionally rounded and above the measured healthy baseline rather than tuned to the exact current output.

## Build and CI contract

- Production builds now always emit the Vite manifest required for deterministic graph measurement.
- `npm run performance:policy:test` protects policy semantics with synthetic tests.
- `npm run perf:budget` writes `performance-report.json` and fails only on the player-visible/architecture guardrails above.
- CI uploads the performance report for 30 days.
- H0G's fail-safe classifier treats performance/build policy files as full-qualification changes.

## Loading policy

The H0D scene manifest remains the canonical loading-policy source. It already separates startup scenes from runtime-eager and on-demand scenes, including on-demand Settings, Starlight Beach, optional activity scenes and the exploration HUD. H0H therefore does not introduce a second loader or mechanically split every scene.

Further scene splitting is justified only when the manifest report shows a material first-playable benefit without creating transition stalls, duplicated shared payload or fragile registration paths. H0J can retire obsolete startup/runtime owners where evidence proves they are no longer needed.

## Current qualification state

The H0H implementation is awaiting current-head CI measurement. Acceptance requires Tier 0, unit/build/static checks, the new performance policy and the authoritative browser qualification selected for this cross-cutting change to pass. The generated `performance-report.json` will provide the exact H0H current-head entry, initial graph, lazy-chunk, total breadth and chunk-count values.
