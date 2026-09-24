# Project Status

Last updated: 2026-09-24

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` has **H3.11.4E - Story House illustration/media pipeline active**.

H3.11.4A physical Story House is human-approved. H3.11.4B long-form library content architecture is technically accepted: authored stories are separate demand-loaded manifests/Markdown assets with generated catalogue metadata and stable block IDs. The 4B StoryLibraryService tests pass; the wider Tier 1 suite still has two unrelated pre-existing save-system test failures.

H3.11.4C reader engine is human-approved. The accepted reader opens from the physical Story House, uses the 4B demand-loaded catalogue/content boundary, keeps the Phaser room underneath, suppresses world movement, and provides responsive long-form reading, chapter navigation and typography controls.

H3.11.4D is human-approved. The Story House now preserves independent per-story semantic resume positions, global reader preferences, Continue Reading, catalogue progress/completion state and explicit book completion through canonical schema-v9 save data.

**Current substantive checkpoint:** H3.11.4E checkpoint 2 corrects the first picture-book presentation after David's visual review. The generic flowing reader remains the long-form mode, while a new `paged-picture-book` mode treats *The Duck Bread Baker* as an actual illustrated book: PDF story pages 2-42 are 41 independent demand-loaded pages with the matching clean artwork and source text, Page X of 41 navigation, Previous/Next page controls and exact page resume through the existing save contract.

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
- H3 - Sunbeam Village Final Polish: H3.1-H3.11.3 human-approved; H3.11.4 Story House rebuild active.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.


**H3.11.4F scope expansion (24 September 2026):** add scalable library discovery and curation support: metadata-driven categories, format/genre/audience/length/series/author dimensions, title/author search, filterable/grouped shelves, source/rights provenance for original/public-domain/licensed works, and Quill recommendations driven by the same taxonomy.
