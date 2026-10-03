# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** remains active.

Current bounded package: **MG-WP4 - Future Mini-Game Authoring Kit and Guardrails**

Branch: agent/mg-wp4-authoring-kit-guardrails

MG-WP3 is complete, human-approved and merged to main at 206bc19ecf8d1f92dca851ed1171b8a328f0b25d.

### Active checkpoint

**MG-WP4A - Authoring contract and catalogue guardrails**

In scope:

- canonical mini-game authoring recipe;
- fail-loud catalogue validation for stable IDs, scene keys, Just Games exposure and variant integrity;
- deterministic test-only fixture proving one canonical game definition can serve world and Just Games contexts;
- durable package/project-state reconciliation.

Later WP4 checkpoints own reusable browser/sandbox verification helpers and cross-roadmap authoring enforcement.

### Human gate

MG-WP4 is Amber.

Do not merge until the complete authoring workflow and guardrails have been reviewed against a representative existing mini-game and David approves the programme closeout.

## Validation state

MG-WP4A implementation is active. Targeted verification is pending on the first branch checkpoint.

The repository performance budget remains a separate known baseline concern and is not redefined by MG-WP4.

## Next work

Finish and validate MG-WP4A, then report the bounded checkpoint before beginning MG-WP4B.

## Operating reminders

- keep one canonical gameplay implementation per mini-game;
- new games must declare Mini-game platform impact;
- world-first games must gain Just Games exposure in the same package;
- Just Games is sandboxed by default;
- if GitHub access fails, reconnect immediately;
- do not sit in repeated CI/deployment polling loops.
