# Project Status

Last updated: 2026-09-22

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` is at **H3.11.1 - Shared interior framework and NPC occupancy**.

H3.1-H3.10 are human-approved. The H3.11.1 implementation checkpoint is committed at `966301ed62570c1612fb4dfbeb592af47510db05`; GitHub CI and the Cloudflare preview are running for that exact code checkpoint. H3.11.1 still requires technical validation to finish and then human visual/play approval before H3.11.2 begins.

The checkpoint replaces the old fixed-screen village-interior/menu contract with a reusable walkable-interior foundation, semantic anchors/collision, shared H3.9 interaction ownership, click navigation, world feedback and authoritative Maple/Tansy interior occupancy. The Bakery-specific full art/content rebuild remains H3.11.2.

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
- H3 - Sunbeam Village Final Polish: H3.1-H3.10 human-approved; H3.11.1 implementation committed and under validation.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.
