# Story House authoring and curation

H3.11.4F keeps Story House content-driven. A conforming book should be added as content, not as a reader-code feature.

## Add a book

1. Create `public/stories/<story-id>/book.json`.
2. Add Markdown chapters under `chapters/`, each with stable `<!-- block:semantic-id -->` markers.
3. Add optional WebP/AVIF cover and illustrations referenced from the manifest.
4. Set discovery metadata for format, genres, audiences and length.
5. Record text, illustration and edition provenance independently.
6. Run `npm run story:catalogue` and validate the generated lightweight catalogue.
7. Run Story Library unit tests and normal selected verification.

## Discovery contract

Player shelves and Quill recommendations use the same metadata.

- Picture Books derives from `discovery.format`.
- Classics derives from the `Classics` genre or a classic-retelling tag.
- Longer Stories derives from `discovery.length`.
- Unread, Continue Reading, Recently Read and Completed derive from canonical per-book reading progress.
- Quill recommendations pass discovery facets into the catalogue. Do not hard-code book IDs into dialogue.

The catalogue may grow without importing chapter prose or full-resolution art into the main JavaScript bundle. Chapters and illustrations remain demand-loaded through the existing Story Library service.

## Catalogue-card copy

Every production story should provide a concise `catalogueBlurb` suitable for the compact library card. Keep it to **80 characters or fewer** where practical. Older content without an authored blurb may use the generated fallback, but new content should treat the short blurb as part of the book package rather than rely on clipping a long description.

Longer descriptive/credit copy belongs in the manifest/reader detail context, not inside the fixed-height browse card.

## Reader-mode choice

Use the existing flowing reader for prose-first work. Use `paged-picture-book` only when page-by-page illustration/text pairing is part of the authored reading experience. Both modes keep stable semantic IDs and canonical reading progress; neither should require bespoke reader code for an individual title.

Paged works may expose tap-left/tap-right and horizontal-swipe navigation in addition to the visible Previous/Next controls. Those gestures must use the same authoritative page-turn path as the buttons so progress/resume behaviour remains identical.

