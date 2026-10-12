## Work package
- ID:
- Bounded package: `docs/work-packages/...`
- Human gate: none / visual / playtest / product / release
- Draft preview URL:
- Visual/functional approval: pending / accepted / not required

## Development stream and overlap review

- Stream: World / Just Games / Story House / Engineering
- Other active PRs touching the same gameplay, global registry or generated catalogue files:
- Shared-file owner and integration handoff (or `none`):
- Base synchronised with latest `main` before **final** qualification: pending during draft


## During draft iteration — provisional only
- Scope and current feedback:
- Known risks, likely test owners and provisional test-impact note (TBC is acceptable):
- Minimal build/smoke and relevant focused checks:

**Keep the PR draft and provide preview URLs promptly. Final code/documentation/test-contract review is not required between ordinary visual changes.**

## Finalisation — complete BEFORE Ready for review
- [ ] Approved behaviour frozen; code and architecture reviewed/tidied
- [ ] Current documentation reconciled against approved behaviour
- [ ] Full Test Impact Assessment reconciled to actual diff and ownership
- [ ] Tests added/updated/replaced OR `tests unchanged — reviewed, with reason` recorded
- [ ] Relevant save, keyboard/mouse/touch, accessibility, browser/compatibility risks addressed
- [ ] Human approval and final evidence recorded as required

## Authoritative qualification — after finalisation
- [ ] Required static/unit/build/smoke checks passed
- [ ] All required Chromium shards and browser compatibility passed on live exact PR head
- [ ] Exact-head Merge Gate green; no unqualified later commits
- [ ] Production deployment separately authorised if requested

## Durable hand-off
- [ ] Material decisions documented in `DECISIONS.md` if applicable
- [ ] `STATUS.md` and `PROJECT_STATE.json` up to date as needed
- Next action, known limitations and blockers:

## Machine-readable test-impact evidence (ENG-WP2.2)

This PR-local JSON is **allowed to remain provisional in draft**. Before Ready for review, set stage to reviewed, list the actual changed areas and affected test contract paths, and complete every finalisation field. A code-only colour change may use disposition unchanged if the retained test coverage is named and the reason is substantive. Do not use this block to hide test removals or unresolved findings.


<!-- TEST_IMPACT_V1
{
  "stage": "provisional",
  "scope": "Briefly describe the work-package outcome",
  "risk": "TBC during finalisation",
  "areas": [],
  "disposition": "pending",
  "contracts": [],
  "reason": "TBC during finalisation",
  "evidence": "TBC during finalisation",
  "reviewedBy": "TBC",
  "codeReview": "pending",
  "documentationReview": "pending",
  "humanAcceptance": "pending"
}
END_TEST_IMPACT_V1 -->
