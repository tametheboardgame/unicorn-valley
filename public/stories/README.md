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
