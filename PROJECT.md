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

R0 through R6 and the accepted R6.5 remediation/final-polish work through the approved Sunbeam Village Story House checkpoint are integrated on `main`.

The current accepted gameplay baseline is PR #181's merge commit `52069b8e36311e14276c2115f3515dfa52f2adb0` (26 September 2026). Its approved head `82dec6e91305d9eed962da46c8af52873a0e98a5` passed CI #4010 across static/architecture checks, unit contracts, build/static smoke/performance, all three Chromium shards and cross-browser compatibility before merge.

Within the open-ended area-polish programme, H1 Moonflower Glade and H2 Moonflower Cottage are complete. H3 Sunbeam Village is active: H3.1-H3.10, H3.11.1-H3.11.4 and H3.11-R1 have reached their documented acceptance points. The next bounded slice is H3.11-R2, the Wobbly Cake baking mini-game, before H3.11.5 Rosehip Cottage and the remaining village-interior work.

The approved whole-game remediation sequence and historical decisions remain recorded in `docs/2026-09-08-REMEDIATION-PROPOSAL.md`, `ROADMAP.md` and `DECISIONS.md`. R7 remains deliberately blocked until the R6.5 final qualification, human replay and WP17 readiness gate are complete.

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
