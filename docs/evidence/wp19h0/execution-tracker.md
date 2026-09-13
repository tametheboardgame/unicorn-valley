# WP19H0 execution tracker

## Authority and delivery

David authorised H0A-H0K in strict order on one long-lived delivery branch. Codex completed bounded H0A only; David then asked ChatGPT to continue directly because Codex/Work usage capacity is exhausted.

- Verified starting main: `ba60ede9ba8697f6015bfb3d79e98152a972403d` (13 September 2026).
- Planning PRs #170 and #171 are merged.
- Delivery branch: `agent/r6.5-wp19h0-consolidation`.
- Umbrella draft PR: #172.
- Canonical contract: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`.

## Phase state

- H0A: accepted after ChatGPT inspection on 13 September 2026.
- H0B: active.
- H0C: not started.
- H0D: not started.
- H0E: not started.
- H0F: not started.
- H0G: not started.
- H0H: not started.
- H0I: not started.
- H0J: not started.
- H0K: not started.

## H0A acceptance evidence

H0A evidence comprises `baseline-architecture.md`, `architecture-test-inventory.json`,
`baseline-bundle.json`, `ci-timing-baseline.json`, raw Actions job responses and
`retirement-candidates.md`. `scripts/architecture/reportWp19h0Bundle.mjs` and the
package command reproduce bundle attribution.

Evidence/tooling checkpoint: `03565680b52653d57e233288622ef9091e6acf65`.
State/inspection hand-off checkpoint: `f014bb9afbe2421063a14fc43cf3cbe1179498bc`.

Inspection confirmed that the H0A PR changes contain no production `src/` edits and no
workflow changes. On head `f014bb9`, Validate AI Project Contract and Immutable
deployment smoke succeed. The CI Validate job passes formatting, lint, type-check,
all 120 Vitest files / 465 tests and production build, then fails only at the inherited
performance check: 650.4 KiB total-JavaScript gzip versus the unchanged 650 KiB legacy
ceiling. Browser shards are consequently skipped by the existing workflow. This matches
the committed H0A baseline and is not an H0A regression.

At source checkpoint `97167f6b78913c16012f636b5733d04e3e7bff41`, the baseline
records 471,915 raw entry bytes, 523,453 gzip initial/title/first-playable static
dependency bytes, 666,008 total-JS gzip bytes and 81 JS chunks. Static dependency bytes
are not runtime timing; no calibrated startup timing is claimed.

H0A acceptance is therefore satisfied: another engineer can recover the architecture
and title-to-first-playable ownership from the evidence, the baseline is reproducible,
and H0A introduced no production behaviour change.

## H0B active scope

The first H0B checkpoint will:

- establish a canonical runtime architecture/layering and service-lifetime contract;
- add executable high-value dependency rules with a self-test that proves a prohibited
  edge is rejected;
- move `ContinueRestoreManager` from the persistence folder into the application
  orchestration boundary without changing its runtime implementation or public/save IDs;
- add the architecture guard to CI without attempting the broader H0F/H0G selective-CI
  redesign.

The migration is deliberately narrow. `ContinueRestoreManager` coordinates persisted
Continue state with title-scene state and lazy Starlight Beach registration, so its
current location under `save/` crosses persistence into scene orchestration. Moving the
owner establishes a real application boundary while preserving behaviour.

## Preservation and gates

Preserve saves/IDs/progression/navigation/movement/races, approved UI,
responsive/accessibility, conversation/interaction and WP19H audio behaviour. Do not
raise performance budgets or delete tests merely to obtain green CI. Unknown risk
escalates validation.

Complete and inspect each H0 phase before advancing. H0K requires the complete
specified suite, cross-browser coverage and immutable preview smoke. Stop after H0K
technical qualification for David's explicit approval. No merge, production deployment
or H1-H13 work is authorised before that gate.