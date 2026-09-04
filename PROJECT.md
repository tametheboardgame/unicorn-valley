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

R0 through R6 are complete. R6.5 - Valley Completeness and Breadth is active. R6.5-WP1 through WP12 are complete on `main`, with R6.5-WP13 - Quest Pack B: Cross-Region and Follow-up Stories active on `r6.5-wp13-cross-region-followups`.

Latest accepted `main` gameplay baseline: `610216ae13b96772d3a7b7e95696c695ddcd1870` (R6.5-WP12 via PR #141).

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
