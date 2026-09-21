# Project Status

Last updated: 2026-09-21

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` is in **Stage 4 implementation**. H3.1 has been implemented and is awaiting technical validation before David's visual review.

H3.1 implementation head `7adf20bbb3088c7f3772cbf816f9d014d76a7f27` removes the legacy rectangular village-square surface, retires the old path geometry that crossed the fountain, removes the fake `shopkeeper-marker`, removes superseded prototype NPC circles/icons and makes the Sunbeam scene the lifecycle authority for its retained production-environment detail. Interactions, colliders, production NPCs, shops and Village Life behaviour remain preserved.

Technical validation is pending. H3.2 has **not** started and must not begin until H3.1 has a trustworthy preview and David approves the visual checkpoint.

## H3 feedback-block-1 sequence

1. H3.1 - Legacy residue and composition ownership cleanup.
2. H3.2 - Village master layout rebuild.
3. H3.3 - Proper plaza and path network.
4. H3.4 - Shop exterior rebuild.
5. H3.5 - Integrated signs and wayfinding.
6. H3.6 - Willow's garden district.
7. H3.7 - Southern residential expansion.
8. H3.8 - Props, bunting, residents and village-life recomposition.

## Numbering rule

H3.1-H3.8 are **not the complete H3 package**. David intends to review the first-pass result and provide at least another feedback block. New work continues at H3.9, H3.10, H3.11 and onward as required.

Do not reserve a hardening/cleanup number now. The final consolidation, responsive regression, hardening, documentation and integrated qualification slice gets the next unused H3 number only after David explicitly says the substantive Sunbeam Village work is complete.

## Completed area-polish packages

- H1 - Moonflower Glade Final Polish: complete and human-approved.
- H2 - Moonflower Cottage & Home Customisation: complete, fully qualified, merged and deployed to production.
- H3 - Sunbeam Village Final Polish: H3.1 implemented; technical validation and human visual review pending.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.
