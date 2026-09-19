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

David has already live-verified the core H2.8 Place / Replace / Move / Remove and save/reload
persistence behaviour. A second visual review rejected the first rounded picker and generic decoration
presentation, so H2.8 remains open for a bounded interaction, physicality and presentation redesign.

Runtime candidate `885fa9941f65678a058febed2f62c4103339496d` now provides the redesigned collection browser,
player-facing decoration categories, direct tap/click placement markers, the semantic `Decorate here`
action, item-aware depth/collision rules and recognisable vector decoration art. Rich placed-decoration
art is lazy-loaded so the hard startup performance budget remains intact.

Exact-head CI run `35444709042` has passed verification planning, formatting, lint, architecture,
type-check, project contract, unit contracts, production build, static smoke and the performance budget.
The full Chromium shards and Chromium/Firefox/WebKit compatibility matrix are still running at this
checkpoint. Cloudflare has deployed the exact runtime candidate.

The package remains waiting for David's visual/physicality recheck and is not human-approved. Do not
start H2.9, merge PR #175 or deploy production until H2.8 is explicitly accepted.

## Next work

1. Allow exact-head run `35444709042` to finish its already-running full Chromium and cross-browser gates.
2. David checks the redesigned collection browser, category filtering, direct placement-point interaction,
   `Decorate here` prompt, return position, recognisable decoration art, rug layering and solid floor
   collision in the deployed preview.
3. Record David's decision; do not start H2.9 without explicit approval.

## H2.8 technical checkpoint

The underlying quantity-aware placement service remains unchanged and previously passed David's live
place/replace/move/remove/persistence check. The current redesign adds a Room-Style-like selected-item
preview and paged collection grid, dynamic player-facing item groups, direct room placement targets,
semantic decorate interaction copy, item/slot-aware physical behaviour and recognisable vector artwork.

Rugs are deliberately below actors with no collider. Wall-mounted and furniture-supported decorations
avoid inappropriate extra blockers. Freestanding floor decorations use Y-aware world depth and authored
static collision footprints. Browser coverage now guards direct marker activation, `Decorate here`,
category filters, rug depth and freestanding decoration collision in addition to the existing persistence
contracts.

Runtime candidate: `885fa9941f65678a058febed2f62c4103339496d`.
Exact-head CI: `35444709042`, full browser matrix still running at this checkpoint.
Immutable preview: https://f5cf2956.unicorn-valley.pages.dev
Stable branch preview: https://agent-r6-5-wp19h2-moonflower.unicorn-valley.pages.dev
