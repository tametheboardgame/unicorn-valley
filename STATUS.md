# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP0 - Mini-Game Platform Foundation**

Branch: `agent/mg-wp0-mini-game-platform-foundation`

Draft PR: **#262**

MG was approved as a genuinely independent programme rather than an R6.5/WP19 sub-stream. PR #260 merged the programme roadmap and repo-wide integration rules to `main` as `54cf69022815d8523be78a079bae56405fd3e414`.

### MG-WP0 checkpoint

Implemented on the current branch:

- one typed catalogue for the seven current mini-game families;
- normalised `world` / `just-games` session context;
- default world-versus-sandbox side-effect policy;
- one manifest-backed generic mini-game launcher/return boundary;
- canonical `SceneManifest` entries for Chess and Pond Leap;
- mini-game-specific verification ownership;
- catalogue/session/sandbox unit contracts;
- a durable audit of every current game's launch, return and persistence ownership.

No existing world caller has been migrated to the new launcher yet. Existing gameplay behaviour therefore remains intentionally unchanged in MG-WP0.

Implementation evidence corrected the safe platform dependency order to:

**MG-WP0 foundation -> MG-WP1 existing-game migration -> MG-WP2 sandbox/persistence isolation -> MG-WP3 Just Games UI -> MG-WP4 future-game authoring guardrails.**

This prevents the Just Games launcher from exposing activities that still write directly to adventure progression before their sandbox boundary exists.

## Validation state

Current branch-head CI is running.

The first MG-WP0 CI attempt failed only the formatter gate and was immediately corrected.

At MG-WP0 branch creation, current `main` already had unrelated full-CI failures from concurrent/recent work, including Story House save-migration expectation drift, older Rainbow Meadow/Rainbow Disc unit issues and a first-playable performance graph approximately 2 KiB over budget. These are baseline issues rather than MG-WP0 behaviour changes unless later evidence shows otherwise.

## Human gate

MG-WP0 is Amber because it establishes cross-cutting architecture.

Do not merge MG-WP0 or begin MG-WP1 until:

- the platform implementation is technically coherent;
- package-required validation has run as far as the current baseline permits;
- any MG-caused failures are fixed;
- David explicitly approves the MG-WP0 architecture implementation.

## Next work

After MG-WP0 is approved and merged, begin **MG-WP1 - Existing game migration to one launch contract**.

World/area, Story House and other programmes remain independent where dependencies and branch conflicts permit.

## Operating reminders

- Use the fast-development CI contract in `AGENTS.md`.
- On a failed current-work CI run, inspect and remediate deterministic in-scope failures immediately.
- If Git/GitHub access fails, reconnect before reporting a blocker.
- Do not duplicate a mini-game implementation to avoid migration or branch conflicts.
