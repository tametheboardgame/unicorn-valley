# Story House generated asset pipeline

## Purpose

This is the approved route for moving ChatGPT-generated artwork into Unicorn Valley without
passing binary image data through the GitHub connector.

The production hand-off is:

**ChatGPT image generation → Google Drive Generated Asset Staging → GitHub Actions via
Workload Identity Federation → deterministic WebP in a development branch → Cloudflare preview**

The pipeline was proven end to end during R6.5-WP19H3.11-R4 on 28 September 2026, including
replacement of the same staged Drive file ID and successful redeployment of the replacement.

## Authentication

GitHub Actions authenticates to Google using GitHub OIDC and Google Cloud Workload Identity
Federation. No service-account JSON key is used or permitted.

Repository Actions variables:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full Workload Identity Provider resource name.
- `GCP_ASSET_SERVICE_ACCOUNT`: dedicated generated-asset service-account email.

The service account has no long-lived key. It is granted only the minimum Workload Identity User
binding required for `tametheboardgame/unicorn-valley`, and the Drive staging folder is shared
with that service account as Viewer.

The workflow requests `id-token: write` solely so `google-github-actions/auth` can exchange
GitHub's short-lived OIDC assertion for short-lived Google credentials.

## Drive staging boundary

Drive hierarchy:

- `Unicorn Valley`
  - `Generated Asset Staging`

The staging folder ID is recorded in `generated-assets/config.json`. A source image is accepted
only when Drive reports that it is directly inside that folder.

ChatGPT may create a new staged file or replace an existing staged file in place. Replacement in
place is preferred during iteration because the Drive file ID remains stable and only the manifest
revision needs to change.

The staging area is a hand-off boundary, not long-term game content storage.

## Repository components

- `.github/workflows/generated-asset-materialisation.yml`
  authenticates through WIF, downloads/processes selected manifests, verifies the result, commits
  changed generated images and pushes them to the existing development branch.
- `scripts/generated-assets/materialise_drive_asset.py`
  validates Drive metadata, downloads the bytes and performs deterministic image conversion.
- `generated-assets/config.json`
  owns staging folder identity, source/output size limits, accepted MIME types and approved
  repository destinations.
- `generated-assets/manifests/*.json`
  contains small text instructions for each staged asset.
- `docs/story-house/GENERATED-ASSET-RUNBOOK.md`
  is the repeatable operator checklist.

## Destination policy

Generated output must be WebP.

Approved destinations are deliberately narrow:

- generic generated assets: `public/assets/generated/`
- Story House generated illustrations:
  `public/stories/<story-id>/illustrations/generated/<asset-name>.webp`

Generated Story House artwork must stay inside the `illustrations/generated` subtree. Historic,
licensed or other source artwork remains separate, making provenance obvious in the repository.

The materialiser rejects absolute paths, path traversal and destinations outside the configured
roots/patterns.

## Modern Story House cover convention

Modern Story House covers normally **reuse an already approved modern reader illustration**. A
cover is a presentation of an existing illustration, not a separate generated-art deliverable.

Canonical rule:

1. Finish and approve the title's modern reader illustration set first.
2. Select the strongest existing reader illustration for the catalogue cover.
3. In `book.json`, point `coverSets[].id = "modern"` directly at that existing generated WebP.
   Do not copy, crop, rename or rematerialise the image just to make a cover.
4. The Story House library adds the book title itself with the shared
   `story-library-cover-title` treatment. **Do not bake title text into the image.**
5. Modern catalogue covers use the existing shared `object-fit: cover` presentation. Start with
   the normal centred crop. If human preview shows that the focal subject is poorly framed, add
   only the smallest story-specific `object-position` rule needed to centre the important subject.
6. Regenerate `public/stories/catalogue.json` from the story manifest after changing
   `coverSets`.

Do **not** create a new Drive staging file, generated-asset manifest or duplicate WebP solely for a
modern cover. If one is created accidentally, remove the redundant manifest/output/staged source
before merge.

A dedicated modern cover asset is an exception, not the normal pipeline. Use one only when the
existing approved reader set genuinely cannot produce an acceptable catalogue crop and the
exception has been explicitly human-approved.

## Source and output validation

Current materialisation rules include:

- source provider must be Google Drive;
- Drive file must be directly inside the configured staging folder;
- accepted source MIME types are PNG, JPEG and WebP;
- maximum source size is controlled by `maxSourceBytes`;
- destination must be repository-relative and end in `.webp`;
- resize uses the manifest's `maxWidth` and `maxHeight`;
- WebP quality uses the manifest's `quality`;
- maximum output size is controlled by `maxOutputBytes`;
- the resulting WebP is reopened/verified in Actions before commit.

## Manifest contract

Example Story House generated illustration:

```json
{
  "schemaVersion": 1,
  "source": {
    "provider": "google-drive",
    "fileId": "DRIVE_FILE_ID"
  },
  "expectedSourceName": "peter-rabbit-garden-v01.png",
  "destination": "public/stories/the-tale-of-peter-rabbit/illustrations/generated/garden-v01.webp",
  "transform": {
    "maxWidth": 1600,
    "maxHeight": 1600,
    "quality": 88
  },
  "revision": 1
}
```

`revision` is intentionally informational. Increment it when the staged Drive file is replaced
in place so a small text commit can request a new materialisation even though the Drive file ID
has not changed.

## Story House provenance rules

For generated Story House illustrations:

1. Do not overwrite historic/public-domain source artwork. Generated artwork gets its own
   `illustrations/generated` subtree.
2. Keep stable, descriptive asset IDs/names. Prefer scene meaning over generation sequence.
3. Record generated-art provenance in the story manifest or companion documentation rather than
   describing generated artwork as public-domain source illustration.
4. Preserve text rights and illustration rights as separate concerns. A public-domain text does
   not make newly generated artwork public domain.
5. Attach reader illustrations to stable chapter/block IDs so prose pagination can change without
   relying on line numbers.
6. Materialise into a feature/content branch and review in Cloudflare before merge.
7. Do not run generated-asset materialisation directly against `main`.

## R4 acceptance proof

R4 proved both required paths:

- first materialisation: a generated PNG was staged in Drive, retrieved through WIF, converted to
  WebP, committed by GitHub Actions and deployed by Cloudflare;
- replacement materialisation: the same Drive file ID was replaced in place with different image
  bytes, the manifest revision was incremented, Actions retrieved the new bytes and Cloudflare
  deployed the replacement.

This two-pass proof is the reference acceptance test for future changes to the pipeline.
