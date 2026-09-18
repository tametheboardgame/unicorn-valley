# Project Status

Last updated: 2026-09-19

## Current work

`R6.5-WP19H2.7 - Furniture Colours & Variants` is active on draft PR #175 / branch `agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.6 are human-approved. H2.6 Walls, Floor & Wallpaper was explicitly approved by David on 18 September 2026 before H2.7 began.

H2.7 implementation is complete at `95127260e9c0df4fc452a9f96ab354de81ecb79c`. It includes:

- save schema v5 with independent named variants for the bed, sofa, tea set and fireplace under the existing `home.style` state;
- appearance-preserving migration from schema v4;
- three curated starter finishes for each supported furniture item;
- a fourth Furniture tab in the existing Room Style editor with item selectors, direct swatches and live preview;
- joint Apply persistence for room surfaces and furniture, while Back continues to discard preview-only changes;
- palette-only rendering that preserves approved furniture geometry, collision, layering, sleep behaviour and semantic anchors;
- safe visual fallback for unknown or retired variant IDs without overwriting the persisted ID;
- catalogue ownership independent from the quest/shop unlock rules reserved for H2.10;
- a browser persistence contract covering simultaneous variants, Apply, reload and canonical furniture ownership.

The H2.7 regression fix also passes the current schema version explicitly into the Crystal Cascade browser context instead of referring to a Node-side import from inside `page.evaluate()`.

The full-suite Nova jump check now holds the real Space input until a visible lift is observed within a bounded window, replacing its flaky single 130 ms sample without weakening the gameplay contract.

## Technical validation

Local validation at the implementation head is green:

- `npm run validate` passed, including 534 unit tests, production build, static smoke and performance architecture budgets;
- the formerly failing Crystal Cascade mobile gate and the H2.7 furniture persistence browser contract passed together in Chromium (3 tests);
- the hardened Nova first-run jump/race/exit browser contract passed four local runs, including three consecutive repeats;
- performance remains inside the hard budgets: 519.8 KiB entry raw, 529.3 KiB first-playable gzip, 7.8 KiB largest lazy chunk and 85 JavaScript chunks.

Authoritative exact-head CI run `35402961969` passed. Verification planning, Tier 0 static/architecture, Tier 1 unit contracts, build/static-smoke/performance, all three full Chromium shards and the Chromium/Firefox/WebKit compatibility matrix are green. Tier 2 was skipped by the verification selector because the complete Tier 3 suite ran.

Cloudflare successfully deployed exact head `9512726` to `https://4bcc412f.unicorn-valley.pages.dev`. The stable branch preview is `https://agent-r6-5-wp19h2-moonflower.unicorn-valley.pages.dev`.

## Current gate

H2.7 is technically qualified and remains open, draft and unmerged while it waits for the human playtest gate.

The required human gate is to change at least three different furniture items to different variants, Apply, walk around and use the bed, then leave/re-enter and reload. David must confirm that appearance persists while collision, layering and sleep remain unchanged.

## Next work

1. David completes the H2.7 furniture walkaround/persistence gate on the exact-head preview.
2. Record David's explicit acceptance or rejection.
3. Do not start H2.8, merge PR #175 or deploy production without that approval.
