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

H2.8 implementation and technical qualification may proceed autonomously within its approved scope.

The next human gate is the H2.8 place/replace/move/remove playtest. Do not start H2.9, merge PR #175 or deploy production until H2.8 has passed technical qualification and David has explicitly accepted the H2.8 result.

## Next work

1. Implement the H2.8 editing-flow upgrade on the existing H2 branch.
2. Replace generic placed-decoration presentation with item-specific cottage presentation where feasible and remove permanent floating names.
3. Add/update unit and browser coverage for quantity correctness, compatibility and place/replace/move/remove.
4. Run bounded technical validation and exact-head CI.
5. Provide the deployed branch preview for David's H2.8 human gate.
