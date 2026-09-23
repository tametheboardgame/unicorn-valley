# Project Status

Last updated: 2026-09-23

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` is at **H3.11.2 - Sunbeam Bakery rebuild**.

H3.1-H3.11.1 are human-approved. David approved the H3.11.1 walkable-interior concept and refined the population rule: existing outdoor village residents stay outside, while rebuilt interiors use dedicated new staff/resident characters unless a later story state explicitly moves a character.

The H3.11.2 implementation checkpoint is committed at `cc6f6f9c9f01ee611d45a6144d4dbcaa4359ce86`. GitHub CI and Cloudflare are running for that code checkpoint. Do not repeatedly poll them.

The Bakery now has a fuller physical shop floor, expanded baking/prep detail, service counter/display, oven, prep bench, recipe shelf, Wobbly Cake table and café seating. Cinnamon is the dedicated baker, rendered through the shared resident system with chef hat and apron role accessories. Maple remains outside, and her Wobbly Cake quest now starts/advances through her exterior resident Talk interaction. Bakery stock now includes repeatable Cloud Biscuits and Sunbeam Swirls, with repeatable Wobbly Cake Slices unlocked after Maple's quest while preserving Berry Bun and Picnic Basket behaviour.

H3.11.2 still requires automated technical validation and human visual/play approval before H3.11.3 begins.

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

H3.1-H3.8 are **not the complete H3 package**. David intends to review each subsequent substantive slice. New work continues at H3.9 onward as required.

Do not reserve a hardening/cleanup number now. The final consolidation, responsive regression, hardening, documentation and integrated qualification slice gets the next unused H3 number only after David explicitly says the substantive Sunbeam Village work is complete.

## Completed area-polish packages

- H1 - Moonflower Glade Final Polish: complete and human-approved.
- H2 - Moonflower Cottage & Home Customisation: complete, fully qualified, merged and deployed to production.
- H3 - Sunbeam Village Final Polish: H3.1-H3.11.1 human-approved; H3.11.2 implementation committed and under validation.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.
