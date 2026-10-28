#!/usr/bin/env python3
"""Validate privileged GitHub Actions asset import requests before granting OIDC."""
from __future__ import annotations
import re
import sys

BRANCH = re.compile(r"agent/[A-Za-z0-9][A-Za-z0-9._/-]*\Z")
MANIFEST = re.compile(r"generated-assets/manifests/[A-Za-z0-9][A-Za-z0-9._-]*\.json\Z")

def validate_branch(value: str) -> str:
    if not BRANCH.fullmatch(value) or ".." in value or "//" in value or value.endswith(("/", ".", "-")):
        raise ValueError("Target must be a valid agent/* development branch (never main).")
    return value

def validate_manifest(value: str) -> str:
    if not MANIFEST.fullmatch(value) or ".." in value or value.endswith(("/",".")):
        raise ValueError("Manifest must be a direct .json file under generated-assets/manifests/.")
    return value

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: validate_request.py TARGET_BRANCH MANIFEST_PATH")
    try:
        validate_branch(sys.argv[1])
        validate_manifest(sys.argv[2])
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
