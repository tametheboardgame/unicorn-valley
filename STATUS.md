# Project Status

Last updated: 2026-10-03

## Current work

The active world-area package is **R6.5-WP19H6 - Crystal Brook Final Area Pass**.

Current bounded checkpoint: **H6.1 - Canonical master layout and ownership migration**

Branch: `agent/r6.5-wp19h6.1-canonical-layout`

Draft PR: **#265**

H6.0 is complete, human-approved and merged to `main`.

MG-WP1 and MG-WP2 have now completed and merged to `main`; the current mainline is `66f05c6a5279cafb6df4e938c721759d0744e898`. H6.1 is reconciled onto that mainline so Crystal Cascade keeps the shared mini-game/race launch contract and sandbox isolation while Brook positions come from the canonical H6 layout.

### H6.1 checkpoint

Implemented:

- one area-owned structural layout for Crystal Brook;
- canonical Meadow, Woods, future Crystal Cup and Crystal Grotto thresholds/returns;
- canonical main, Woods, Crystal Cup and Grotto routes;
- canonical water, Ripple, Echo, depth-interaction, guidance and Grotto-return anchors;
- reserved Crystalarium and Crystal Checkers activity pockets;
- scene, gateway, path-cleanup, guidance, population, depth and Grotto-return consumers migrated away from duplicated structural coordinates;
- focused layout/reachability/route-endpoint tests;
- no intentional visual movement, progression rewrite or gameplay redesign.

MG-WP1's shared Rainbow Run launch/session/return behaviour is preserved. H6.6 later changes the physical access topology to the Crystal Cup hub, not the shared mini-game session architecture.

## Mini-game dependency state

MG-WP0, MG-WP1 and MG-WP2 are complete and merged.

H6.8 now waits on **MG-WP3 and MG-WP4** before Crystalarium or Crystal Checkers implementation may begin.

## Validation state

Before the MG-WP1 mainline move, H6.1 had passing formatting, lint, architecture, verification-policy, type-check, unit and targeted Chromium contracts.

The H6.1-only initial graph overhead had been reduced from +0.9 KiB to +0.4 KiB relative to the original H6.0 baseline. The latest optimisation flattens runtime Brook constants so unused planning data can tree-shake.

A fresh CI run is required on the reconciled MG-WP2/H6.1 head.

## Human gate

H6.1 remains the active bounded checkpoint.

Do not begin H6.2 until:

- the reconciled H6.1 head has completed relevant technical validation;
- H6.1 has been reported;
- David has reviewed/approved the checkpoint.

## Next work

After H6.1 approval, begin **H6.2 - Continuous Brook and Rainbow Meadow hydrology**.

## Operating reminders

- Keep Brook structural coordinates area-owned.
- Preserve MG-WP1 shared mini-game launch/session ownership.
- Preserve accepted Ripple/Echo/Grotto progression and Meadow/Woods traversal.
- Do not create bespoke mini-game launch architecture.
- If GitHub access fails, reconnect immediately.
- Do not sit in repeated CI/deployment polling loops.
