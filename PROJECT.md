# Project Charter

## Identity

Project ID: `unicorn-valley`

Display name: Unicorn Valley

## Purpose

Create a cosy browser-based unicorn life-adventure in which a young player can create her own unicorn, explore a persistent magical valley, build friendships, discover secrets, decorate home, race and see the world remember what she has done.

## Primary audience

A young child, with the design primarily tuned around the intended seven-year-old player while remaining understandable and pleasant for other players.

## Desired outcomes

- A coherent small game that supports open-ended exploration and repeat play.
- Child-readable interaction with minimal pressure and low reading burden.
- Persistent, meaningful world and home changes.
- Several credible play fantasies rather than one over-developed activity dominating by default.

## Current accepted baseline

R0 through R6 and R6.5-WP1 through WP16 are integrated. WP18A-G and human-approved WP18I/J are integrated through PR #158. Accepted gameplay head: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`; audit base main: `d9b765c0293045251619783a4ced4b01068e993a`.

The 2026-09-08 user request commissions a whole-game audit and revised remediation proposal before further implementation. `R6.5-WP19-PLAN` was approved on 2026-09-08, including its documentation push/draft PR. WP19A is next; WP18K remains bounded foundation work and approved WP19A-I precede the final WP18H/WP17 replay gates. See `docs/2026-09-08-REMEDIATION-PROPOSAL.md`.

R7 is deliberately blocked until R6.5-WP17 releases the human readiness gate.

## Scope

Current committed scope is defined by the canonical R6.5 release contract at `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`, with relevant companion specifications including `docs/07W-R6.5-CONTENT-BLUEPRINT.md` and `docs/07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md`.

## Non-goals

- Do not jump into R7 preference-led expansion before the R6.5 human gate.
- Do not introduce advertising, purchases, public social systems or FOMO mechanics.
- Do not build future major systems such as full gardening, flight or deep cooking unless a later approved roadmap package owns them.
- Do not replace reusable architecture with bespoke content hacks simply to finish one package faster.

## Critical invariants

- Choice without pressure.
- Customisation and decorating remain core gameplay.
- Exploration should repeatedly reward curiosity.
- Racing and activities reward participation as well as mastery.
- Touch/mobile is first-class.
- Saves remain versioned and compatible across normal updates.
- Child UX, accessibility and safety standards remain in force.
- Main remains releasable.

## Technical baseline

- Phaser 4
- TypeScript
- Vite
- Node.js 22 CI reference runtime
- npm
- Biome formatting/linting
- Vitest unit tests
- Playwright automated browser and compatibility testing
- Cloudflare Pages production hosting
- Versioned local browser saves

See `docs/03-TECHNICAL-ARCHITECTURE.md` and `docs/08-DEVELOPMENT.md` for the detailed architecture/development contract.

## Delivery policy

`pr_required`

One work package per branch by default. Existing package-specific branch conventions remain valid. Agent-led infrastructure/operating changes use `agent/` branches. CI must pass before technical completion. Human acceptance remains separate where a package defines a visual, playtest, product or release gate.

## Deployment / release boundary

Production deployment to Cloudflare Pages is Red unless explicitly authorised. Repository changes may prepare a deployable build without performing production release actions.

## Security / data sensitivity

The game does not require user accounts, public profiles, chat or payment data. Do not introduce secrets or external data collection without an explicitly approved package and review.
