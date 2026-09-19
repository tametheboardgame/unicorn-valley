# Project Status

Last updated: 2026-09-19

## Current work

`R6.5-WP19H2.8 - Placeable Decoration Upgrade` is active on draft PR #175 / branch `agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.7 are human-approved. H2.7 Furniture Colours & Variants was explicitly approved by David on 19 September 2026 after the furniture-variant gate passed on all fronts.

H2.8 now owns the earned/placeable decoration layer. The accepted baseline is:

- `HomeDecorationService` remains the canonical owner of decoration ownership, compatibility, placement and quantity reconciliation;
- H2.5 Decorate mode remains the canonical owner of when decoration slots and editing affordances exist;
- `CottageDecorateScene` is the existing slot editor and is to be evolved rather than duplicated;
- permanent furniture styling from H2.6/H2.7 is out of scope for H2.8;
- the current generic placed-decoration glow/icon/floating-name presentation is prototype presentation and may be replaced at source;
- wall/floor/table/shelf/display compatibility must remain explicit and testable;
- place, replace, move and remove must preserve owned-vs-placed quantity correctness.

## H2.7 acceptance record

H2.7 implementation completed at `95127260e9c0df4fc452a9f96ab354de81ecb79c` and its authoritative exact-head CI run `35402961969` passed the full selected qualification, including all three Chromium shards and the Chromium/Firefox/WebKit compatibility matrix.

David completed the H2.7 furniture walkaround/persistence gate on 19 September 2026 and confirmed it passed on all fronts. H2.7 is therefore complete and human-approved.

A later documentation/status-only head triggered a full Chromium run in which one older supporting-resident dialogue/portrait test timed out while 71 tests in that shard passed. This does not revoke the exact-head H2.7 technical qualification, but H2.8 qualification must still finish with a known clean CI state before its human gate.

## Current gate

H2.8 implementation is complete at `8f5a65b043cf1e934101e6790874a240f5e1863e` and local technical qualification passes. Exact-head CI is pending after publication. The package is waiting for David’s place/replace/move/remove playtest; it is not human-approved.

The next human gate is the H2.8 place/replace/move/remove playtest. Do not start H2.9, merge PR #175 or deploy production until H2.8 has passed technical qualification and David has explicitly accepted the H2.8 result.

## Next work

1. Publish the qualified H2.8 checkpoint and confirm exact-head CI and the branch preview.
2. David playtests explicit place, replace, move and remove flows across slot categories, then reloads/Continues and checks that normal play has no floating decoration names.
3. Record David’s decision; do not start H2.9 without explicit approval.

## H2.8 technical checkpoint

The visible-choice picker, explicit Place/Replace/Move/Remove copy, canonical quantity-aware service result contract, item-coloured cottage presentation and no-floating-name normal-play treatment are implemented. `npm run validate` passes (536 unit tests), and `npx playwright test tests/play/r6.5-wp19h2-decorate-mode.spec.ts` passes both H2.5 regression and H2.8 placement/persistence/removal coverage. Existing lint warnings remain non-failing and unrelated.
