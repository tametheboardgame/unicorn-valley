# Project Status

Last updated: 2026-10-04

## Current work

The independent **MG - Mini-Game Development Programme** remains active.

Current bounded package: **MG-WP4 - Future Mini-Game Authoring Kit and Guardrails**

Branch: agent/mg-wp4-authoring-kit-guardrails

MG-WP3 is complete, human-approved and merged to main at 206bc19ecf8d1f92dca851ed1171b8a328f0b25d.

### Completed checkpoint

**MG-WP4A - Authoring contract and catalogue guardrails**

Implemented and technically verified apart from the inherited repository performance-budget failure. The WP4A branch has no production-runtime delta relative to main.

### Active checkpoint

**MG-WP4B - Reusable behavioural verification contracts**

Implementation complete; CI validation is pending.

In scope now implemented:

- dedicated declarative Just Games launch/return browser contract for all current catalogue families;
- reusable sandbox no-adventure-write test-support contract;
- reusable world-side-effect companion assertion;
- mini-game verification ownership updated so platform/Just Games changes select the reusable browser contract;
- authoring recipe updated with the exact extension path for future games.

### Human gate

MG-WP4 is Amber.

Do not merge until MG-WP4C completes the cross-roadmap enforcement/closeout review and David approves programme closeout.

## Validation state

MG-WP4B awaits the branch CI run.

The repository performance gate is a separate inherited baseline concern: current main-derived production output exceeds the existing startup/chunk budgets even when the WP4 branch contains no production-runtime changes. MG-WP4 does not weaken those thresholds.

## Next work

Validate MG-WP4B and report the bounded checkpoint. Do not begin MG-WP4C until that checkpoint state is known.

## Operating reminders

- keep one canonical gameplay implementation per mini-game;
- new games must declare Mini-game platform impact;
- world-first games must gain Just Games exposure in the same package;
- Just Games is sandboxed by default;
- if GitHub access fails, reconnect immediately;
- do not sit in repeated CI/deployment polling loops.
