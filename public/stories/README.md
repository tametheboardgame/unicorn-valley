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

The reader loads the catalogue first, a selected `book.json` only when needed, and individual chapter Markdown only when opened. Illustration loading is added in H3.11.4E; declaring future chapter illustrations in a manifest does not change the rule that the whole library must never be preloaded at startup.
