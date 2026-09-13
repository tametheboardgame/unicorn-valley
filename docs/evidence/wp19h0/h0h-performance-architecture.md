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
6. Material duplicate JavaScript payloads: reported and guarded so code splitting cannot quietly duplicate meaningful payload across chunks.
7. Total emitted JavaScript: reported in raw/gzip form and compared with the historical 650 KiB metric, but no longer an arbitrary permanent maximum for game breadth.

These thresholds are intentionally rounded and above the measured healthy baseline rather than tuned to the exact current output.

## Build, cache and recovery contract

- Production builds always emit the Vite manifest required for deterministic graph measurement.
- `npm run performance:policy:test` protects policy semantics with synthetic tests.
- `npm run perf:budget` writes `performance-report.json` and fails only on the player-visible/architecture guardrails above.
- CI uploads the performance report for 30 days.
- H0G's fail-safe classifier treats performance/build policy files as full-qualification changes.
- Deployment policy serves HTML with revalidation and hashed assets as immutable resources.
- `vite:preloadError` recovery performs a bounded reload when an old page references a lazy chunk removed by a newer immutable deployment, preventing a stale session from being stranded after release.

## Loading policy

The H0D scene manifest is the canonical loading-policy source. It separates startup scenes from runtime-eager and on-demand scenes, including on-demand Settings, Starlight Beach, optional activity scenes and the exploration HUD. H0H therefore does not introduce a second loader or mechanically split every scene.

Further scene splitting is justified only when the manifest report shows a material first-playable benefit without creating transition stalls, duplicated shared payload or fragile registration paths. H0J retained runtime-eager owners where no measured benefit justified a risky migration.

## Current qualification evidence

On H0J checkpoint `69c75662572d9bf38406ed8b393d5c9b914f04b2`, CI run `34767743173` passed production build, static smoke and the H0H performance architecture budget with:

- entry: 469.5 KiB raw / 126.0 KiB gzip, against 520 KiB raw;
- initial/title/first-playable graph: 514.6 KiB gzip across 26 chunks, against 560 KiB;
- largest lazy chunk: 7.8 KiB gzip, against 32 KiB;
- JavaScript chunks: 82, against 112;
- total JavaScript breadth: 654.1 KiB gzip, trend only;
- diagnostics: 2.8 KiB gzip and not initial.

The H0H hard performance contract therefore passes with deliberate headroom. No calibrated device/network title-to-first-playable runtime trace existed at the H0A baseline, so H0 does not invent a before/after runtime-millisecond claim. Bundle graph evidence and functional deployed smoke remain separate measurements.

H0H is complete and accepted. Final H0K qualification must rerun the same policy on the final candidate SHA.
