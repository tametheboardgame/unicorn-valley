#!/usr/bin/env python3
"""Materialise one generated image from the approved Google Drive staging folder."""

from __future__ import annotations

import argparse
import io
import json
import os
from pathlib import Path
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "generated-assets" / "config.json"
DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object.")
    return value


def resolve_destination(destination: str, allowed_roots: list[str]) -> Path:
    candidate = Path(destination)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ValueError("Destination must be a repository-relative path without '..'.")

    normalised = candidate.as_posix()
    if not any(normalised.startswith(root) for root in allowed_roots):
        raise ValueError(
            f"Destination {normalised!r} is outside approved generated-asset roots: "
            + ", ".join(allowed_roots)
        )
    if candidate.suffix.lower() != ".webp":
        raise ValueError("Generated assets must materialise as .webp files.")

    absolute = (ROOT / candidate).resolve()
    if ROOT not in absolute.parents:
        raise ValueError("Destination resolves outside the repository.")
    return absolute


def drive_service(credentials_json: str):
    credentials_info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=[DRIVE_READONLY_SCOPE],
    )
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def download_drive_file(service, file_id: str) -> tuple[dict[str, Any], bytes]:
    metadata = (
        service.files()
        .get(
            fileId=file_id,
            fields="id,name,mimeType,size,parents,trashed",
            supportsAllDrives=True,
        )
        .execute()
    )
    request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return metadata, buffer.getvalue()


def validate_source(
    metadata: dict[str, Any],
    payload: bytes,
    config: dict[str, Any],
    manifest: dict[str, Any],
) -> None:
    if metadata.get("trashed"):
        raise ValueError("Drive source is in the trash.")

    staging_folder_id = str(config["stagingFolderId"])
    parents = metadata.get("parents") or []
    if staging_folder_id not in parents:
        raise ValueError("Drive source is not directly inside the approved staging folder.")

    allowed_mime_types = set(config["allowedMimeTypes"])
    mime_type = metadata.get("mimeType")
    if mime_type not in allowed_mime_types:
        raise ValueError(f"Unsupported source MIME type: {mime_type!r}.")

    declared_size = int(metadata.get("size") or len(payload))
    max_source_bytes = int(config["maxSourceBytes"])
    if declared_size > max_source_bytes or len(payload) > max_source_bytes:
        raise ValueError(
            f"Source is too large ({max(declared_size, len(payload))} bytes; "
            f"limit {max_source_bytes})."
        )

    expected_name = manifest.get("expectedSourceName")
    if expected_name and metadata.get("name") != expected_name:
        raise ValueError(
            f"Drive source name {metadata.get('name')!r} does not match "
            f"expectedSourceName {expected_name!r}."
        )


def transform_image(
    payload: bytes,
    destination: Path,
    transform: dict[str, Any],
    max_output_bytes: int,
) -> tuple[int, int, int]:
    max_width = int(transform.get("maxWidth", 1600))
    max_height = int(transform.get("maxHeight", 1600))
    quality = int(transform.get("quality", 88))

    if max_width <= 0 or max_height <= 0:
        raise ValueError("maxWidth and maxHeight must be positive.")
    if not 1 <= quality <= 100:
        raise ValueError("quality must be between 1 and 100.")

    with Image.open(io.BytesIO(payload)) as image:
        image.verify()

    with Image.open(io.BytesIO(payload)) as image:
        image.load()
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=quality, method=6)
        width, height = image.size

    output_size = destination.stat().st_size
    if output_size > max_output_bytes:
        destination.unlink(missing_ok=True)
        raise ValueError(
            f"Materialised output is too large ({output_size} bytes; limit {max_output_bytes})."
        )

    return width, height, output_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--receipt-file")
    args = parser.parse_args()

    config = load_json(CONFIG_PATH)
    if config.get("schemaVersion") != 1:
        raise ValueError("Unsupported generated-assets config schemaVersion.")

    manifest_path = (ROOT / args.manifest).resolve()
    if ROOT not in manifest_path.parents:
        raise ValueError("Manifest path resolves outside the repository.")
    manifest = load_json(manifest_path)
    if manifest.get("schemaVersion") != 1:
        raise ValueError("Unsupported generated-asset manifest schemaVersion.")

    source = require_mapping(manifest.get("source"), "source")
    if source.get("provider") != "google-drive":
        raise ValueError("source.provider must be 'google-drive'.")
    file_id = str(source.get("fileId") or "").strip()
    if not file_id:
        raise ValueError("source.fileId is required.")

    destination_value = str(manifest.get("destination") or "").strip()
    if not destination_value:
        raise ValueError("destination is required.")
    destination = resolve_destination(
        destination_value,
        [str(value) for value in config["allowedDestinationRoots"]],
    )

    transform = require_mapping(manifest.get("transform", {}), "transform")

    credentials_json = os.environ.get("GDRIVE_GENERATED_ASSET_SERVICE_ACCOUNT_JSON", "").strip()
    if not credentials_json:
        raise RuntimeError(
            "GDRIVE_GENERATED_ASSET_SERVICE_ACCOUNT_JSON is not configured."
        )

    service = drive_service(credentials_json)
    metadata, payload = download_drive_file(service, file_id)
    validate_source(metadata, payload, config, manifest)
    width, height, output_size = transform_image(
        payload,
        destination,
        transform,
        int(config["maxOutputBytes"]),
    )

    relative_destination = destination.relative_to(ROOT).as_posix()
    result = {
        "sourceFileId": file_id,
        "sourceName": metadata.get("name"),
        "sourceMimeType": metadata.get("mimeType"),
        "destination": relative_destination,
        "width": width,
        "height": height,
        "outputBytes": output_size,
    }
    print(json.dumps(result, indent=2))

    if args.receipt_file:
        receipt_path = Path(args.receipt_file)
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        receipt_path.write_text(relative_destination + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
