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


## Multi-edition books

Single-edition books remain valid `schemaVersion: 1` packages and require no migration.

Use `schemaVersion: 2` only when one catalogue title needs two or more reader editions, for example a child-friendly Story House adaptation alongside a complete public-domain classic text. Shared catalogue metadata remains at book level; authored reading content moves into explicit editions.

```json
{
  "schemaVersion": 2,
  "id": "alices-adventures-in-wonderland",
  "title": "Alice's Adventures in Wonderland",
  "description": "Shared catalogue description.",
  "catalogueBlurb": "Shared catalogue blurb.",
  "cover": {
    "path": "covers/cover.webp",
    "alt": "Historic Alice illustration."
  },
  "series": null,
  "tags": ["classic-retelling", "classics"],
  "discovery": {
    "format": "Chapter Book",
    "genres": ["Fantasy", "Classics"],
    "audiences": ["Read Together", "Independent Reader"],
    "length": "Longer Read"
  },
  "publication": { "status": "published" },
  "defaultEditionId": "story-house",
  "editions": [
    {
      "id": "story-house",
      "label": "Story House Edition",
      "author": "Lewis Carroll, retold by Quill",
      "readingMode": "flowing",
      "rights": {},
      "chapters": []
    },
    {
      "id": "full-classic",
      "label": "Full Classic Text",
      "author": "Lewis Carroll",
      "readingMode": "flowing",
      "rights": {},
      "chapters": []
    }
  ]
}
```

Edition IDs use the same lower-kebab-case rule as story and chapter IDs. Each edition owns its own author/byline, reading mode, rights/provenance and chapter list. Chapter and illustration paths remain relative to the book directory, so edition-specific content may be organised under paths such as `editions/full-classic/chapters/01.md`.

The reader shows an edition selector only when a manifest contains more than one edition. Progress, resume position and completion are stored independently for each edition. The default edition continues to use the historic per-story save key, which preserves existing player progress when a legacy single-edition book is later converted to a multi-edition book. Alternate editions use edition-specific progress keys internally.

Opening a multi-edition book resumes the most recently read edition. Switching editions saves the current position first, then resumes the selected edition at its own saved position. The catalogue continues to contain one card per title rather than duplicating books by edition.

## Independent illustration sets

When one text edition has more than one legitimate art treatment, keep the prose/chapter structure
single and define illustration sets on that edition. Do not duplicate the edition merely to switch
art.

Existing `chapter.illustrations` remains valid and is normalised as one implicit illustration set,
so existing books need no migration.

For a schema-v1 single-edition book, illustration sets may be declared at the book level:

```json
{
  "schemaVersion": 1,
  "id": "the-hare-and-the-tortoise",
  "chapters": [
    {
      "id": "the-race",
      "title": "The Hare and the Tortoise",
      "path": "chapters/01.md"
    }
  ],
  "illustrationSets": [
    {
      "id": "classic",
      "label": "Classic Illustrations",
      "rights": {
        "status": "public-domain",
        "source": "Richard Heighway illustrations, 1894"
      },
      "chapters": [
        {
          "chapterId": "the-race",
          "illustrations": [
            {
              "id": "classic-start",
              "blockId": "the-challenge",
              "path": "illustrations/start.webp",
              "alt": "Historic illustration of the hare and tortoise.",
              "placement": "inline",
              "width": 166,
              "height": 200
            }
          ]
        }
      ]
    },
    {
      "id": "modern",
      "label": "Modern Illustrations",
      "rights": {
        "status": "original",
        "source": "Generated for Unicorn Valley Story House"
      },
      "chapters": [
        {
          "chapterId": "the-race",
          "illustrations": [
            {
              "id": "modern-start",
              "blockId": "the-challenge",
              "path": "illustrations/generated/start.webp",
              "alt": "Modern Story House illustration of the race beginning.",
              "placement": "full-width",
              "width": 1200,
              "height": 800
            }
          ]
        }
      ]
    }
  ]
}
```

For schema-v2 books, put `illustrationSets` on each edition because Story House and Full Classic
text can have different chapter/block IDs. The same underlying image file may be referenced by both
editions when appropriate; only the block mapping needs to differ.

Defaults are deliberately conventional:

- a `full-classic` edition prefers an available `classic` set;
- every other edition prefers an available `modern` set;
- otherwise the first set is used;
- `defaultIllustrationSetId` may override the convention explicitly.

The reader shows the Illustrations selector only when the active edition has at least two sets.
The player's choice is remembered independently per story edition. Every explicit set carries its
own rights/provenance metadata so generated art never inherits historic/public-domain provenance.

Do not mix legacy `chapter.illustrations` with explicit `illustrationSets` inside the same edition.

## Reader-mode choice

Use the existing flowing reader for prose-first work. Use `paged-picture-book` only when page-by-page illustration/text pairing is part of the authored reading experience. Both modes keep stable semantic IDs and canonical reading progress; neither should require bespoke reader code for an individual title.

Paged works may expose tap-left/tap-right and horizontal-swipe navigation in addition to the visible Previous/Next controls. Those gestures must use the same authoritative page-turn path as the buttons so progress/resume behaviour remains identical.

