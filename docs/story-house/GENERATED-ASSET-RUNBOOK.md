# Generated Story House illustration runbook

Use this checklist for each generated illustration or small batch.

## 1. Work on a content branch

Create/use the Story House content branch for the book being illustrated. Do not target `main`
with the generated-asset workflow.

Keep generated-art work independent from world/gameplay branches unless the reader itself needs a
shared fix.

## 2. Generate the image

Generate the approved image in ChatGPT.

During iterative art direction, keep character appearance, palette, framing and aspect-ratio
requirements explicit. For a multi-image book, establish a small visual bible before producing the
full set so character continuity is intentional rather than repaired at the end.

## 3. Stage in Google Drive

Upload the generated source image to:

`Unicorn Valley / Generated Asset Staging`

Use a descriptive source filename, for example:

`peter-rabbit-mcgregor-garden-v01.png`

For a first version, create a new Drive file.

For a replacement of an already staged image, replace that Drive file **in place** so its file ID
does not change.

## 4. Add or update the manifest

Create a JSON file under:

`generated-assets/manifests/`

Recommended convention:

`story-<story-id>-<asset-id>.json`

Example destination:

`public/stories/<story-id>/illustrations/generated/<asset-id>.webp`

Manifest fields:

- `schemaVersion`: currently `1`;
- `source.provider`: `google-drive`;
- `source.fileId`: staged Drive file ID;
- `expectedSourceName`: guards against accidentally materialising the wrong Drive file;
- `destination`: approved generated WebP path;
- `transform.maxWidth` / `maxHeight`;
- `transform.quality`;
- `revision`: start at 1 and increment for replacement passes.

Commit the manifest change.

## 5. Let GitHub Actions materialise it

The generated-asset workflow authenticates through Workload Identity Federation, downloads the
staged file, validates it, converts it to WebP and commits the output to the same development
branch.

Do not repeatedly poll Actions. Check once when useful; if it is still running, report what is
pending and stop.

If the workflow fails, inspect and fix the failure immediately.

## 6. Wire the image into Story House

Update the book's `book.json` illustration metadata to reference the generated WebP and the
correct stable `blockId`.

For existing editions, preserve independent reading progress and edition IDs. If generated art is
being introduced as a distinct visual edition rather than replacing an existing illustration set,
model that explicitly instead of silently overwriting provenance.

Run:

`npm run story:catalogue`

and the focused Story Library tests when the manifest/catalogue changes.

## 6A. Select the modern cover from the approved reader art

Do this **after** the modern reader illustrations are approved.

1. Choose the existing modern reader illustration that makes the clearest catalogue cover.
2. Add or update the story's `coverSets` so:
   - `classic` continues to point at the historic/existing classic cover;
   - `modern` points directly at the chosen reader WebP under
     `illustrations/generated/`.
3. Do not generate a separate cover image and do not make a second copy of the selected reader
   illustration.
4. Do not add the title to the image. `StoryReaderOverlay` supplies the standard modern-cover
   title overlay in the Story House library.
5. Let the shared `object-fit: cover` crop centre normally first. If the important subject is
   badly framed in the catalogue card, use a narrow story-specific CSS `object-position`
   adjustment and verify it in Cloudflare.
6. Run `npm run story:catalogue` so the catalogue receives the updated cover-set path.

**Cover anti-patterns:** a new title-bearing PNG/WebP, a cover-only Drive upload, a cover-only
generated-asset manifest, or a duplicate cropped asset when the approved reader illustration
already works. Remove such accidental assets before merge.

## 7. Review the Cloudflare preview

Check:

- correct image appears at the intended passage/page;
- aspect ratio and crop are appropriate;
- no stretched/upscaled presentation;
- phone/tablet/desktop reader layouts remain usable;
- lazy loading still behaves correctly;
- text remains readable and page turning/navigation is unaffected;
- replacement assets actually change in the deployed preview.

## 8. Iterate safely

If an illustration needs another attempt:

1. generate the replacement;
2. replace the same Drive file in place;
3. increment `revision` in the existing manifest;
4. commit;
5. let Actions rematerialise the same destination;
6. visually review the new Cloudflare deployment.

This is the preferred fast iteration loop.

## 9. Finalise provenance and cleanup

Before merge:

- confirm generated artwork is clearly separated from historic/source illustration folders;
- ensure manifest rights/provenance text describes the generated set accurately;
- keep only approved final assets in the story package;
- remove obsolete generated manifests when they are no longer useful operationally;
- remove temporary staging files from Drive once there is no foreseeable need to iterate on them.

The reusable pipeline itself remains in the repository. Do not recreate one-off binary-download
workflows for each book.
