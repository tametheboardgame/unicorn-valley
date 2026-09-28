# Generated asset manifests

Each JSON manifest instructs the GitHub Actions generated-asset materialiser to retrieve one image
from the approved Google Drive staging folder and write a deterministic WebP into an approved
repository asset root.

Example:

```json
{
  "schemaVersion": 1,
  "source": {
    "provider": "google-drive",
    "fileId": "DRIVE_FILE_ID"
  },
  "expectedSourceName": "r4-pipeline-smoke-source.png",
  "destination": "public/assets/generated/r4-smoke/pipeline-smoke.webp",
  "transform": {
    "maxWidth": 768,
    "maxHeight": 768,
    "quality": 88
  },
  "revision": 1
}
```

The `revision` field is deliberately informational. Incrementing it is the safe way to request
a replacement materialisation when the Drive file has been replaced in place while retaining the
same file ID.

Security and validation rules are owned by `generated-assets/config.json` and
`scripts/generated-assets/materialise_drive_asset.py`:

- the source must be directly inside the configured staging folder;
- only PNG, JPEG and WebP source images are accepted;
- source and output byte limits are enforced;
- output must be a `.webp` below an approved generated-asset repository root;
- absolute paths and path traversal are rejected;
- GitHub Actions writes only to an existing development branch, never directly to `main`.

The long-lived manual workflow uses `workflow_dispatch`. The R4 feature branch also has a
temporary manifest-change push trigger so the end-to-end pipeline can be proven before the
workflow itself reaches `main`.
