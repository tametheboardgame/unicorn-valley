# C17 approved painted backgrounds — binary upload gate

The original desktop and mobile paintings have both been **approved and locked** by the user.

## Exact files required in this folder

- `garden-desktop-approved-1920x1080.webp` — 722,946 bytes, SHA-256 `bb31ab491d498d5aebb31546575cd244126e4437467f40a2ec6558f5db13e6f8`.
- `garden-portrait-approved-1080x1920.webp` — 498,790 bytes, SHA-256 `f25bae9923d06070cab91a741967d1a266b68779889f443568ee9c3c464bf684`.

The images exist as approved user-conversation artefacts, but the connected GitHub write interface does **not** accept a local filesystem path or file reference as binary content. `create_blob` accepts raw base64/UTF-8 only, and cannot obtain the local bytes from the asset container in the same tool call. Therefore **do not claim these images are uploaded** until GitHub file listings and SHA-256 verification confirm it.

The user can upload the two supplied WebPs directly to this directory on the existing World PR branch using GitHub's **Add file → Upload files**. They must select `agent/world-h6-9c-crystalarium-full-game`, not `main`. This is the only required manual hand-off if no supported connector can transfer the actual bytes.

To check the exact file data after upload, run:

```sh
node scripts/art/verifyCrystalariumC17Assets.mjs
```

This is a strict fail-closed checksum check, not automatically invoked on the unuploaded draft files. Once both files are present, the independent no-save [C17 design preview](/design-previews/crystalarium-c17-illustrated-layout.html) loads them automatically; until then it displays the prior procedural SVG layout study with an accurate status label.

After upload: use exact-head Chromium screenshots at 320×700, 390×844, 1280×720, 1440×900 to verify central board legibility, order-card contrast, potion/well affordances, responsive layout and no unintended save writes. Leave C18–C24 gameplay changes gated.
