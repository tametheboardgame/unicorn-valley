# H0F tiered verification model

## Purpose

H0F separates development feedback cost from final qualification confidence. Selective verification is an optimisation for pull-request feedback only; it never authorises merging a work package without the authoritative full qualification required by its completion gate.

## Tier model

- **Tier 0 - static and architecture:** formatting, lint, architecture boundaries, verification-policy self-tests, conditional TypeScript type-check and conditional AI project-contract validation.
- **Tier 1 - unit contracts:** the complete Vitest suite for now. H0G owns safe related/changed selection and the source-to-test ownership map.
- **Tier 2 - targeted Chromium smoke:** a bounded browser group selected by coarse change class. `presentation-smoke` covers Settings/responsive presentation; `critical-runtime-smoke` covers automated core play, Continue state and world navigation.
- **Tier 3 - full Chromium:** all Playwright play tests, three shards.
- **Tier 4 - cross-browser/deployed qualification:** the Chromium/Firefox/WebKit compatibility subset. Immutable deployed startup/save/reload/Continue remains the separate `Immutable deployment smoke` workflow because it requires an exact immutable preview URL and candidate SHA; it is manual package/release qualification rather than a generic PR expense.

## H0F change classes

The H0F classifier is intentionally conservative and coarse. H0G will replace coarse path families with a version-controlled ownership map and richer deterministic group selection.

- **docs-only:** documentation/project-state files only. Tier 0 and project-contract validation.
- **micro-fix:** CSS/presentation-only runtime changes, optionally with docs. Tier 0, production build/performance visibility and the `presentation-smoke` browser group. Full unit/cross-browser suites are not charged to a 4px-style presentation edit.
- **bounded-feature:** runtime/content/test changes outside shared escalation paths. Tier 0, complete unit contracts, build/performance and `critical-runtime-smoke`.
- **full-qualification:** shared/core/state/build/test-infrastructure, unknown/unmapped paths, push to main, scheduled run or manual full-CI request. Tier 0, complete unit contracts, full three-shard Chromium and cross-browser compatibility plus build/performance.

Shared/core escalation includes workflow/scripts/package/config changes, `src/main.ts`, persistence, application orchestration, event/config infrastructure, canonical scene registry/lifecycle infrastructure and shared browser-test support. Unknown files fail safe to full qualification.

## Workflow behaviour

`CI` remains the authoritative verification workflow and now emits `verification-plan.json` plus a human-readable job summary containing the detected class, selected tiers, browser group, reason and changed files.

The inherited 650 KiB performance gate remains unchanged and visible. Browser qualification no longer depends on that known failing step, so H0 work can collect behavioural evidence while H0H addresses the performance architecture. Build/static smoke still run before the performance check.

Manual `workflow_dispatch` is the full-CI escape hatch. Pushes to `main` always force full qualification. A weekly Sunday scheduled full run exercises the authoritative suite even when no release is pending.

The former H0C and H0E phase-specific verification workflows remain available manually for forensic regression work but no longer run on every PR. The separate project-contract workflow is also retained manually because Tier 0 now owns conditional project-state validation. Immutable deployment smoke is manual and requires the exact candidate URL/SHA, preventing a PR from appearing to validate a stale deployment candidate.

## Safety boundary with H0G

H0F establishes the tiers, coarse classes, escalation safety and CI topology. H0G must make selection deterministic at subsystem ownership level, including a version-controlled source/config-to-test map, stable Playwright grouping/tags, safe Vitest related/changed selection, richer classifier tests and machine/human selection reports. Until H0G proves narrower ownership, H0F errs towards escalation or full unit coverage.
