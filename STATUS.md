# Project Status

Last updated: 2026-10-04

## Current work

The independent **MG - Mini-Game Development Programme** remains active.

Current bounded package: **MG-WP4 - Future Mini-Game Authoring Kit and Guardrails**

Branch: agent/mg-wp4-authoring-kit-guardrails

MG-WP3 is complete, human-approved and merged to main at 206bc19ecf8d1f92dca851ed1171b8a328f0b25d.

### Completed checkpoints

**MG-WP4A - Authoring contract and catalogue guardrails**

Complete. The canonical authoring recipe, catalogue integrity guard and deterministic dual-context fixture are implemented.

**MG-WP4B - Reusable behavioural verification contracts**

Complete. Static/architecture checks and the reusable Just Games browser contract pass. The contract now waits for game-specific readiness where required, including Wobbly Cake.

### Active checkpoint

**MG-WP4C - Cross-roadmap enforcement and closeout**

Implementation and branch CI validation are complete. The package is waiting at the Amber human closeout gate.

Implemented:

- current/next work packages must declare valid front-matter `mini_game_platform_impact` before the project-state validator accepts them;
- historical packages remain valid without retrofitting;
- authoring, engineering, acceptance, testing and platform architecture documentation now describe the implemented MG platform;
- Sunbeam Chess was reviewed against the authoring recipe and conforms: one stable ID, one gameplay scene, shared launcher/session, world wrapper, Just Games reuse and sandbox contract;
- no production-runtime code was added by MG-WP4.

### Human gate

MG-WP4 is Amber.

Do not merge until technical closeout state is known and David approves programme closeout.

## Validation state

MG-WP4B targeted validation is passing.

The repository performance gate remains a separate inherited baseline concern: current main-derived production output exceeds the existing startup/chunk budgets even when the WP4 branch has no production-runtime delta. MG-WP4 does not weaken those thresholds.

MG-WP4C repository-selected CI is passing on the exact branch head. No in-scope technical failures remain.

## Next work

Await David's Amber closeout approval. If approved, merge PR #269 and mark MG-WP4 complete.

## Operating reminders

- keep one canonical gameplay implementation per mini-game;
- every current/next work package must declare `mini_game_platform_impact`;
- world-first games must gain Just Games exposure in the same package;
- Just Games is sandboxed by default;
- if GitHub access fails, reconnect immediately;
- do not sit in repeated CI/deployment polling loops.
