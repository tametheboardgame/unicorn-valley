# Project Status

Last updated: 2026-10-03

## Current work

The active world-area package is **R6.5-WP19H6 - Crystal Brook Final Area Pass**.

Current bounded checkpoint: **H6.2 - Continuous Brook and Rainbow Meadow hydrology**

Branch: `agent/r6.5-wp19h6.2-continuous-brook`

Draft PR: **#268**

H6.0 and H6.1 are complete, human-approved and merged. H6.1 merged as `fd006355ce5292a2b7fdcfc66b6f787ff31753bb`.

MG-WP3 has also completed and merged to `main` at `206bc19ecf8d1f92dca851ed1171b8a328f0b25d`. H6.2 is being reconciled onto that mainline; MG-WP3 does not overlap the Brook implementation.

### H6.2 checkpoint

Implemented:

- one canonical variable-width Brook from the eastern upstream cascade through the lower basin, central crossings, upper basin and westward through the Rainbow Meadow threshold;
- filled outer/inner/deep water geometry rather than a thick stroked polyline;
- Reflection Pool connected as a real side basin;
- upstream cascade presentation moved into Crystal Brook ownership;
- duplicate Brook water producers retired from final-graphics, depth and R6 gateway compatibility layers;
- broad pool blockers replaced with smaller deep-water collision zones so shallows remain intentionally wadeable;
- water interaction anchors realigned to the rebuilt geography;
- regression coverage for the one-owner hydrology contract.

### H6.2 visual refinement

The first visual review found that the continuous Brook had become too dominant and visually buried the walking path. H6.2B narrowed/softened the Brook and restored the path.

The second visual review found two remaining composition issues: the Brook still exited through the cave mouth instead of above it, and the H6.2B path treatment did not match the established world-path styling.

H6.2C therefore:

- keeps the reduced Brook widths and softer water bands from H6.2B;
- separates the player gateway from the water exit: the walking path reaches the Rainbow Meadow cave mouth at the canonical threshold, while the Brook bends above/behind the cave and exits at a higher water-specific anchor;
- uses the same rounded two-layer path treatment as the established world paths (`0xd7c18f` outer / `0xf0dfb2` inner, 128/108 widths);
- removes the older generic `ExplorationPathPolishManager` Crystal Brook overlay so only one main Brook path presentation remains;
- keeps the canonical traversal/gateway route unchanged, leaving any structural route redesign to H6.5;
- preserves the continuous-water model and all H6.2 progression/collision semantics.

### H6.2D race-side crossing refinement

The next visual review found that the race-side junction still tangled the Brook, the main path and the race spur together, while the Reflection Pool connection read as an unnatural second river.

H6.2D therefore:

- reroutes the presentation path so it approaches the Brook from the south bank and crosses once, approximately perpendicular to the watercourse;
- adds a dedicated bridge at that crossing;
- removes the redundant Brook-Woods compatibility redraw because the area-owned main path already serves that route;
- gives the Crystal Cup/race spur a narrower established-style presentation route starting from the far bank;
- replaces the wide straight Reflection Pool inlet with a narrow curved feeder channel;
- keeps functional race/Woods/Grotto gateways and traversal coordinates unchanged.

### H6.2E bridge correction

The next visual review showed that H6.2D had over-corrected: the bridge was too vertical, too dominant and materially wrong for Crystal Brook.

H6.2E therefore:

- moved the bridge west so its western landing sat around the player position shown in the review screenshot;
- rotated it to cross west-to-east with only a slight northward rise;
- replaced the timber construction with an initial crystal/rock treatment.

### H6.2F east-side topology cleanup

The following visual review showed that the wider race-side topology itself was the remaining problem, so the minimum necessary part of the later Crystal Cup gateway work has been deliberately pulled forward.

H6.2F now:

- replaces the single improvised bridge arrangement with **two glacial-crystal bridge crossings**;
- splits the main beige path into three land-only segments so it stops at each bridge and resumes on the far bank instead of running underneath the Brook;
- retains only the separate western stepping-stone crossing;
- moves the Brook-side Whispering Woods threshold down to the lower east edge and gives it the second bridge approach;
- moves the Crystal Cup entrance to the north edge and labels it **"The Crystal Cup Raceway"**;
- gives the Crystal Cup route a clean northbound path spur after the first bridge;
- removes the old Brook cleanup-manager race-path redraw and tap-forward target;
- adds an on-demand provisional `CrystalCupEntryScene` / `CrystalCupHubMap` shell;
- changes Brook → Crystal Cup from direct `RaceScene` launch to Brook → Crystal Cup hub → Crystal Cascade race;
- returns Crystal Cascade to the Crystal Cup hub first, with the hub owning the return to Crystal Brook;
- leaves proper Crystal Cup hub design/maturity for H6.6 rather than attempting the final race-hub experience now.

## Mini-game dependency state

MG-WP0, MG-WP1, MG-WP2 and MG-WP3 are complete and merged.

H6.8 now waits only on **MG-WP4** before Crystalarium or Crystal Checkers implementation may begin.

## Validation state

The first H6.2 implementation passed formatting, lint, architecture, type-check, targeted browser and production build/static smoke. The repository performance budget remained red at 563.3 KiB / 113 chunks.

A fresh CI run is required on the refined, MG-WP3-reconciled H6.2 head.

## Human gate

H6.2F remains a substantive visual checkpoint.

Do not begin H6.3 until:

- relevant technical validation is complete as far as the repository baseline permits;
- an exact-head preview of the refinement is available;
- David has confirmed the two glacial bridges, lower Woods entrance, north-edge Crystal Cup Raceway gateway and cleaned east-side path topology read correctly.

## Next work

After H6.2 approval, begin **H6.3 - Rainbow Meadow cave/gorge entrance**.

## Operating reminders

- Keep Brook hydrology area-owned.
- Do not reintroduce water through generic compatibility managers.
- Preserve accepted Ripple/Echo/Grotto progression and Meadow/Woods traversal.
- Preserve MG-WP1-MG-WP3 shared mini-game/session/catalogue behaviour.
- If GitHub access fails, reconnect immediately.
- Do not sit in repeated CI/deployment polling loops.
