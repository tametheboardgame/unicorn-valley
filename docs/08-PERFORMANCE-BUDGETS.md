# R6 and R6.5 Performance and Loading Budgets

This note records the concrete guardrails introduced by R6-WP6.7 and the approved R6.5 breadth-phase recalibration. `docs/07-WORK-PACKAGES.md` remains authoritative for package scope.

## Asset and preload review

The production presentation currently generates the playable art as Phaser vector/texture work and the production audio through the browser-safe Web Audio layer. The only file in `public/` is the small SVG favicon, so there is no image or audio payload that benefits from lossy compression in the current build.

That makes JavaScript parse/execution and repeated presentation synchronisation the dominant load concerns rather than network-heavy region assets.

If later work adds external image or audio assets, they should be loaded by the smallest owning scene/region rather than added to one global preload dump. Large raster art should use an appropriate compressed browser format and audio should be encoded for browser delivery before the budgets below are raised.

## Build strategy

- Phaser is emitted as a named vendor chunk so the large, stable engine payload can remain browser-cached when game code changes.
- Browser diagnostics are dynamically imported only for `?diagnostics=1`, keeping test-only inspection code out of the normal initial application path.
- The browser regression suite runs against `vite preview` of the production build instead of the development server.
- `npm run perf:budget` runs after every production build in CI and in the combined validation script.
- The exact PR head must also complete its Cloudflare Pages preview check before merge; a stale or in-progress Pages check is treated as a deployment blocker rather than being inferred from local/CI success.

## R6 reference baseline

The original R6 guardrails were based on the measured R6-WP6.7 production build: approximately 504 kB application code, 1,375 kB Phaser, 2.3 kB on-demand diagnostics and 492 kB total gzip.

The original all-JavaScript ceilings were:

- 2,050 KiB raw;
- 560 KiB gzip.

Those values remain the R6 reference baseline. CI should continue to report when the current production build exceeds them so growth remains visible.

## R6.5 breadth-phase recalibration

R6.5 deliberately adds substantial production content across existing regions before its final performance/load reconciliation in R6.5-WP16. WP6 still fitted the R6 total-JavaScript ceiling; WP7 first crossed the raw ceiling by approximately 1.9 KiB, and the WP5-WP8 stack measured approximately 2,075.8 KiB raw / 565.7 KiB gzip. Entry and largest-chunk limits remained healthy.

That evidence shows the old total-JavaScript ceiling is being crossed by cumulative approved breadth content rather than a single accidental bundle regression. On 2026-09-03 the R6.5 performance policy was therefore explicitly recalibrated rather than silently weakened.

Hard CI limits through R6.5-WP15 are:

- application entry chunk: at most 520 KiB raw;
- largest JavaScript chunk: at most 1,800 KiB raw;
- all JavaScript R6.5 safety envelope: at most 2,400 KiB raw;
- all JavaScript R6.5 safety envelope: at most 650 KiB gzip;
- Phaser must remain isolated in a named chunk;
- BrowserDiagnostics must remain a separate on-demand chunk and must not be referenced by initial HTML.

The 2,400/650 KiB values are bounded interim safety ceilings, not new target sizes. They provide roughly 17% total-JavaScript headroom over the old R6 ceiling for the explicitly approved breadth release while preserving a hard tripwire against uncontrolled growth.

The old 2,050/560 KiB R6 figures remain visible as reference metrics. Crossing the reference is expected during R6.5 and must be explained by production content; crossing the R6.5 safety envelope remains a blocking CI failure.

No further increase to the R6.5 safety envelope is permitted before R6.5-WP16 without a new explicit Amber decision.

R6.5-WP16 must perform the full larger-content performance/load review, including bundle composition, code splitting/dynamic loading opportunities, runtime profiling and browser regression. It must either reduce/repartition the completed content set or establish the final R6.5 release budget from measured evidence before the R6.5-WP17 human readiness gate.

## Runtime profiling

Diagnostics collect a rolling 180-frame sample only when diagnostics mode is enabled. Frame intervals are measured from wall-clock `performance.now()` timestamps between rendered callbacks rather than Phaser's smoothed simulation delta, so a genuine main-thread transition stall cannot be hidden by engine delta smoothing/capping.

The R6-WP6.7 browser regression checks normal world-scene transitions against deliberately tolerant CI-safe limits:

- normal diagnostic scene transition under 1 second;
- 95th percentile frame duration under 120 ms after settling;
- no sampled frame over 500 ms during the tested transition window.

These runtime limits remain unchanged by the R6.5 bundle-policy recalibration. They are severe-hitch regression limits, not a claim that 120 ms is the desired player-facing frame target. Ordinary play should remain close to display refresh cadence.

## Update-loop policy

Gameplay-critical movement, collision, gateway detection and race control stay frame-accurate. Managers whose job is to discover or repair presentation objects are allowed to synchronise at 100-120 ms intervals because a fraction-of-a-second presentation delay is not player-visible but removes repeated full scene scans from most frames.
