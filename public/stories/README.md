# Story House authored story content

Long-form Story House books live under `public/stories/<story-id>/` so prose and artwork remain independently addressable static assets rather than being compiled into the main game JavaScript.

Each story owns a `book.json` manifest plus one or more Markdown chapter files. Use lower-kebab-case stable IDs. Every chapter must contain one or more stable resume markers in this form:

```md
<!-- block:chapter-opening -->
# Chapter title

Story text...
```

Block IDs are semantic bookmark anchors. Keep them stable when editing prose so saved reader positions can survive ordinary rewrites. Do not use line numbers, page numbers or character offsets as content identity.

Run `npm run story:catalogue` after adding or changing story manifests. The generator validates manifests, chapter files, block IDs and declared WebP assets, then writes the lightweight `public/stories/catalogue.json` used for browsing. Only stories with `publication.status: "published"` enter that catalogue.

The reader loads the catalogue first, a selected `book.json` only when needed, and individual chapter Markdown only when opened. Illustration assets remain separate from the JavaScript bundle and are attached to stable chapter blocks through manifest metadata.

Illustration metadata uses a stable `blockId`, an `inline` or `full-width` placement, intrinsic `width`/`height` values, alt text and an optional caption. WebP and AVIF assets are accepted. The DOM reader creates image elements only for the selected chapter and marks them `loading="lazy"` plus `decoding="async"`, so entering Story House never downloads a whole illustrated book.

`The Duck Bread Baker` is the first real media-backed reference package. Its initial H3.11.4E checkpoint intentionally uses a representative cover plus early-story, turning-point and back-matter illustrations before the same pipeline is expanded across the remaining source artwork.


## Picture-book page mode

Set `readingMode` to `paged-picture-book` when the authored work is page-led rather than continuous prose. Each manifest chapter then represents one reader page and must contain exactly one stable content block plus exactly one illustration. The reader labels these entries as pages, loads only the selected page's Markdown/artwork, and preserves the normal stable chapter/block save contract. Flowing books continue to use the existing long-form reader unchanged.

`The Duck Bread Baker` is the reference implementation: its PDF story pages 2-42 map to 41 demand-loaded reader pages, each with the matching extracted illustration and source text.


## Discovery and rights metadata

Every story manifest now carries metadata used by the scalable Story House browser:

- `discovery.format`: a player-readable format such as `Picture Book`, `Short Story` or `Novel`.
- `discovery.genres`: one or more player-readable categories. New values are content metadata; they do not require reader code.
- `discovery.audiences`: reading-style labels such as `Read Together`, `Early Reader` or `Independent Reader`.
- `discovery.length`: a player-readable length band such as `Quick Read` or `Longer Read`.
- free-form `tags` remain available for secondary search terms.
- `catalogueBlurb` is the compact card copy shown in the browse grid. Keep it to **140 characters or fewer**, ideally one short sentence. New stories should provide it explicitly. Older content without it receives a word-boundary fallback derived from `description`, so full descriptions never have to be visually clipped inside cards.

The catalogue generator copies only lightweight discovery fields and a compact rights-status summary into `catalogue.json`. Full provenance remains in `book.json`.

Rights/provenance uses separate `text`, optional `illustrations` and optional `edition` records. Each has a status of `original`, `public-domain`, `licensed` or `unknown`, plus a source and optional source URL, rights holder and notes. This separation is deliberate: an old public-domain text can still be paired with a modern copyrighted translation, edition or illustration set.
