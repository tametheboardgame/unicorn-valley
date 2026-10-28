# C17 approved painted backgrounds — imported and verified
Both original paintings are **user approved and locked**. Their optimised WebP runtime assets are now stored directly in this GitHub branch:
- `garden-desktop-approved-1920x1080.webp` — 722,946 bytes, SHA-256 `bb31ab491d498d5aebb31546575cd244126e4437467f40a2ec6558f5db13e6f8`, Git blob `d222f54d3685cc287a1843e425a9d65dab1bf5f5`.
- `garden-portrait-approved-1080x1920.webp` — 498,790 bytes, SHA-256 `f25bae9923d06070cab91a741967d1a266b68779889f443568ee9c3c464bf684`, Git blob `1bb33626ff7547d3502cc93abfd7f5d049fd546b`.

**Transfer path:** local approved files → user's existing Google Drive `Unicorn Valley` folder → authenticated Google Drive raw/base64 retrieval → GitHub `create_blob` → World PR tree/commit. Git blob hashes independently match `git hash-object` on the approved local WebPs. No manual user action required. Source-quality desktop/portrait PNGs also reside in the same user's Drive folder; they are not shipped in runtime to avoid expanding the game bundle.

The no-save [C17 preview](/design-previews/crystalarium-c17-illustrated-layout.html) loads the painted desktop or 9:16 portrait WebP for the relevant viewport, with earlier SVG stand-ins as a failure fallback. Run the strict exact-bytes verifier:
```sh
node scripts/art/verifyCrystalariumC17Assets.mjs
```
Then inspect SHA-bound Chromium screenshots at 320×700, 390×844, 1280×720 and 1440×900. Confirm board/order-card readability, functional demonstration controls and save isolation. Background art itself is approved; **actual UI-overlay composition and final C17 completion remain gated**. No C18–C24 rules, gameplay save migration or merge is authorised by this asset commit.
