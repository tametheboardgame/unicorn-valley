#!/usr/bin/env python3
"""Validate the standard AI-assisted project operating contract."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED_FILES = [
    "README.md",
    "AGENTS.md",
    "PROJECT.md",
    "ROADMAP.md",
    "STATUS.md",
    "DECISIONS.md",
    "TESTING.md",
    "ACCEPTANCE.md",
    "PROJECT_STATE.json",
    "docs/work-packages/README.md",
]

REQUIRED_STATE_KEYS = {
    "schema_version",
    "template_initialised",
    "project_id",
    "display_name",
    "phase",
    "current_work_package",
    "current_work_package_path",
    "status",
    "autonomy_state",
    "agent_state",
    "branch",
    "latest_commit",
    "ci_state",
    "technical_validation_state",
    "human_acceptance_state",
    "next_work_package",
    "next_work_package_path",
    "human_input_required",
    "blocker_reason",
    "night_shift_state",
    "chat_disposition",
    "delivery_mode",
    "last_activity_at",
    "updated_at",
}

ENUMS = {
    "status": {"planned", "in_progress", "blocked", "waiting_human", "complete", "paused", "idle"},
    "autonomy_state": {"green", "amber", "red"},
    "agent_state": {"active", "idle", "blocked", "waiting_human", "not_configured"},
    "ci_state": {"passing", "failing", "running", "unknown", "not_configured"},
    "technical_validation_state": {"pending", "running", "passing", "failing", "not_applicable", "unknown"},
    "human_acceptance_state": {"not_required", "pending", "accepted", "rejected", "unknown"},
    "night_shift_state": {"running", "paused", "blocked", "complete", "not_configured"},
    "chat_disposition": {"keep", "archive", "delete", "not_assessed"},
    "delivery_mode": {"pr_required", "direct_green_allowed", "automation_direct_allowed"},
}

WP_REQUIRED_KEYS = {"id", "title", "status", "autonomy", "depends_on", "parallel_safe", "human_gate"}
WP_STATUSES = {"proposed", "approved", "in_progress", "waiting_human", "blocked", "complete", "cancelled"}
WP_AUTONOMY = {"green", "amber", "red"}
TEMPLATE_TOKEN = re.compile(r"\bTEMPLATE_[A-Z0-9_]+\b")


def error(errors: list[str], message: str) -> None:
    errors.append(message)


def parse_iso(value: object) -> bool:
    if not isinstance(value, str) or value.startswith("TEMPLATE_"):
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def parse_scalar(value: str):
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        items: list[str] = []
        for raw_item in inner.split(","):
            item = raw_item.strip()
            if (item.startswith('"') and item.endswith('"')) or (
                item.startswith("'") and item.endswith("'")
            ):
                item = item[1:-1]
            if item:
                items.append(item)
        return items
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    return value


def parse_front_matter(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening YAML front matter delimiter")
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration as exc:
        raise ValueError("missing closing YAML front matter delimiter") from exc
    data: dict[str, object] = {}
    for line in lines[1:end]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            raise ValueError(f"unsupported front matter line: {line}")
        key, value = stripped.split(":", 1)
        data[key.strip()] = parse_scalar(value)
    return data


def validate_wp(path: Path, expected_id: str | None, errors: list[str]) -> None:
    try:
        metadata = parse_front_matter(path)
    except (OSError, ValueError) as exc:
        error(errors, f"{path.relative_to(ROOT)}: {exc}")
        return
    missing = WP_REQUIRED_KEYS - metadata.keys()
    if missing:
        error(errors, f"{path.relative_to(ROOT)} missing WP metadata keys: {sorted(missing)}")
    if metadata.get("status") not in WP_STATUSES:
        error(errors, f"{path.relative_to(ROOT)} has invalid status: {metadata.get('status')!r}")
    if metadata.get("autonomy") not in WP_AUTONOMY:
        error(errors, f"{path.relative_to(ROOT)} has invalid autonomy: {metadata.get('autonomy')!r}")
    if not isinstance(metadata.get("depends_on"), list):
        error(errors, f"{path.relative_to(ROOT)} depends_on must be an inline list, e.g. [] or [WP-001, WP-002]")
    if not isinstance(metadata.get("parallel_safe"), bool):
        error(errors, f"{path.relative_to(ROOT)} parallel_safe must be true or false")
    if expected_id and metadata.get("id") != expected_id:
        error(errors, f"{path.relative_to(ROOT)} id {metadata.get('id')!r} does not match state pointer {expected_id!r}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--template-repository", action="store_true", help="Allow template placeholders only in the template repo itself")
    args = parser.parse_args()

    errors: list[str] = []

    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            error(errors, f"Missing required file: {rel}")

    state_path = ROOT / "PROJECT_STATE.json"
    if not state_path.is_file():
        for item in errors:
            print(f"ERROR: {item}")
        return 1

    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: PROJECT_STATE.json is invalid: {exc}")
        return 1

    missing_keys = REQUIRED_STATE_KEYS - state.keys()
    extra_keys = state.keys() - REQUIRED_STATE_KEYS
    if missing_keys:
        error(errors, f"PROJECT_STATE.json missing keys: {sorted(missing_keys)}")
    if extra_keys:
        error(errors, f"PROJECT_STATE.json has unrecognised keys: {sorted(extra_keys)}")

    for key, allowed in ENUMS.items():
        value = state.get(key)
        if value in allowed:
            continue
        if args.template_repository and isinstance(value, str) and value.startswith("TEMPLATE_"):
            continue
        error(errors, f"PROJECT_STATE.json {key} has invalid value: {value!r}")

    for key in ("updated_at", "last_activity_at"):
        value = state.get(key)
        if args.template_repository and isinstance(value, str) and value.startswith("TEMPLATE_"):
            continue
        if not parse_iso(value):
            error(errors, f"PROJECT_STATE.json {key} is not a valid ISO 8601 timestamp: {value!r}")

    if not isinstance(state.get("template_initialised"), bool):
        error(errors, "PROJECT_STATE.json template_initialised must be boolean")
    if not args.template_repository and state.get("template_initialised") is not True:
        error(errors, "Generated project has not been initialised: set template_initialised=true after replacing template values")

    if state.get("human_input_required") is not True and state.get("human_input_required") is not False:
        error(errors, "PROJECT_STATE.json human_input_required must be boolean")

    if state.get("autonomy_state") == "red" and state.get("agent_state") == "active":
        error(errors, "Red autonomy state cannot have agent_state=active")
    if state.get("status") == "complete" and state.get("current_work_package") is not None:
        error(errors, "Complete project should not normally retain a current work package")
    if state.get("human_input_required") is True and state.get("status") not in {"waiting_human", "blocked", "planned"}:
        error(errors, "human_input_required=true should normally use status waiting_human, blocked or planned")

    for id_key, path_key in (("current_work_package", "current_work_package_path"), ("next_work_package", "next_work_package_path")):
        wp_id = state.get(id_key)
        wp_path = state.get(path_key)
        if (wp_id is None) != (wp_path is None):
            error(errors, f"{id_key} and {path_key} must both be null or both be populated")
            continue
        if isinstance(wp_path, str):
            candidate = (ROOT / wp_path).resolve()
            try:
                candidate.relative_to(ROOT.resolve())
            except ValueError:
                error(errors, f"{path_key} escapes repository root: {wp_path}")
                continue
            if not candidate.is_file():
                error(errors, f"{path_key} does not exist: {wp_path}")
            else:
                validate_wp(candidate, wp_id if isinstance(wp_id, str) else None, errors)

    wp_dir = ROOT / "docs" / "work-packages"
    if wp_dir.is_dir():
        for wp in sorted(wp_dir.glob("*.md")):
            if wp.name in {"README.md", "EXAMPLE-WORK-PACKAGE.md"}:
                continue
            validate_wp(wp, None, errors)

    if not args.template_repository:
        for rel in REQUIRED_FILES + ["POST-CREATION-CHECKLIST.md"]:
            path = ROOT / rel
            if path.is_file():
                match = TEMPLATE_TOKEN.search(path.read_text(encoding="utf-8"))
                if match:
                    error(errors, f"Unresolved template token {match.group(0)} in {rel}")
        state_text = state_path.read_text(encoding="utf-8")
        match = TEMPLATE_TOKEN.search(state_text)
        if match:
            error(errors, f"Unresolved template token {match.group(0)} in PROJECT_STATE.json")

    if errors:
        for item in errors:
            print(f"ERROR: {item}")
        print(f"Validation failed with {len(errors)} error(s).")
        return 1

    print("AI project operating contract validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
