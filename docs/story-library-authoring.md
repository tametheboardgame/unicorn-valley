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
