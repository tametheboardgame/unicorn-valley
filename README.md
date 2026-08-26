# Unicorn Valley

A cosy browser-based unicorn life-adventure designed primarily for a seven-year-old player.

The player creates her own unicorn, lives at Moonflower Cottage, explores a magical valley, makes recurring friends, collects discoveries, decorates her home, enters races and sees the world remember what she has done.

## Project status

**R6 - Production Presentation and Accessibility complete through R6-WP6.9, Browser and Deployment Hardening.**

R0 through R6 now cover the playable foundation, living-valley vertical slice, Rainbow Run racing, deeper friendship/home systems, the expanded valley and the production-quality presentation/accessibility/hardening pass. The final R6 package adds browser-family compatibility coverage, deployment/reload/cache checks and a Cloudflare Pages production/preview verification gate.

The next package is **R7-WP7.1 - Structured Preference Review**. R7 deliberately uses observed play behaviour to decide whether customisation, cottage/garden play, racing, exploration or another demonstrated interest should receive the next major expansion.

The production branch is deployed to `https://unicorn-valley.pages.dev/`.

## Core principles

- Choice without pressure.
- Customisation and decorating are core gameplay.
- Frequent small discoveries and secrets.
- NPC friendship with visible persistent consequences.
- Racing and mini-games reward participation as well as mastery.
- Minimal reading burden and forgiving child-first UX.
- No adverts, purchases, chat, public profiles or real-world FOMO systems.
- Local, versioned save data in early releases.

## Planned technology

- Phaser
- TypeScript
- Vite
- GitHub
- Cloudflare Pages
- Local browser saves initially

## Design documentation

- [Game Vision](docs/00-GAME-VISION.md)
- [Core Game Systems](docs/01-GAME-SYSTEMS.md)
- [World, Characters and Content](docs/02-WORLD-CHARACTERS-CONTENT.md)
- [Technical Architecture](docs/03-TECHNICAL-ARCHITECTURE.md)
- [Child UX, Accessibility and Safety](docs/04-CHILD-UX-ACCESSIBILITY-SAFETY.md)
- [Art and Audio Direction](docs/05-ART-AUDIO-DIRECTION.md)
- [Development Roadmap](docs/06-ROADMAP.md)
- [Detailed Work Packages](docs/07-WORK-PACKAGES.md)
- [Development and Validation](docs/08-DEVELOPMENT.md)
- [Responsive Canvas and Input Diagnostic](docs/09-RESPONSIVE-INPUT-DIAGNOSTIC.md)
- [Cloudflare Pages Deployment](docs/10-CLOUDFLARE-PAGES-DEPLOYMENT.md)
- [Moonflower Glade Prototype](docs/11-MOONFLOWER-GLADE-PROTOTYPE.md)
- [Interaction Framework](docs/12-INTERACTION-FRAMEWORK.md)
- [Dialogue Framework](docs/13-DIALOGUE-FRAMEWORK.md)
- [Unicorn Creator V1](docs/14-UNICORN-CREATOR-V1.md)
- [Pip Intro and First Discovery](docs/15-PIP-FIRST-DISCOVERY.md)
- [Wonderbook Shell](docs/16-WONDERBOOK-SHELL.md)
- [R1 First Playable Hardening](docs/17-FIRST-PLAYABLE-HARDENING.md)
- [Sunbeam Village Prototype](docs/18-SUNBEAM-VILLAGE-PROTOTYPE.md)
- [Item and Inventory System](docs/19-ITEM-INVENTORY-SYSTEM.md)
- [Quest Engine V1](docs/20-QUEST-ENGINE-V1.md)
- [Relationship System V1](docs/21-RELATIONSHIP-SYSTEM-V1.md)
- [Willow's Moonflowers](docs/22-WILLOWS-MOONFLOWERS.md)
- [Moonflower Cottage Interior](docs/23-COTTAGE-INTERIOR.md)
- [Decorating V1](docs/24-DECORATING-V1.md)
- [Optional Activity Suggestions](docs/25-OPTIONAL-ACTIVITY-SUGGESTIONS.md)
- [Vertical Slice Audio/UI Pass](docs/26-VERTICAL-SLICE-AUDIO-UI-PASS.md)
- [R2 Pre-Playtest Visual Polish](docs/27-R2-PRE-PLAYTEST-VISUAL-POLISH.md)
- [R2 Daughter Playtest and Recovery](docs/28-R2-DAUGHTER-PLAYTEST-RECOVERY.md)
- [R2 Layering and World Props](docs/29-R2-LAYERING-WORLD-PROPS.md)
- [R3 Rainbow Meadow and Race Hub](docs/30-R3-RAINBOW-MEADOW-RACE-HUB.md)
- [R3 Race Movement Prototype](docs/31-R3-RACE-MOVEMENT-PROTOTYPE.md)
- [R3 Race Obstacles, Boosts and Collectables](docs/32-R3-RACE-OBSTACLES-BOOSTS-COLLECTABLES.md)
- [R3 NPC Racers and Position Tracking](docs/33-R3-NPC-RACERS-POSITION-TRACKING.md)
- [R3 Race Results and Rewards](docs/34-R3-RACE-RESULTS-REWARDS.md)
- [R3 Nova's First Race Story](docs/35-R3-NOVA-FIRST-RACE-STORY.md)
- [R3 Race Assistance and Difficulty](docs/36-R3-RACE-ASSISTANCE-DIFFICULTY.md)
- [R3 Racing Presentation Pass](docs/37-R3-RACING-PRESENTATION-PASS.md)
- [R6 Production Presentation Implementation Log](docs/07D-R6-IMPLEMENTATION-LOG.md)

## Release plan

- **R0 - Foundation and Pre-production**: complete.
- **R1 - My Unicorn: First Playable**: complete.
- **R2 - Living Valley Vertical Slice**: complete.
- **R3 - Rainbow Run Racing**: complete.
- **R4 - Friendship, Secrets and Home Depth**: complete.
- **R5 - The Valley Gets Bigger**: complete.
- **R6 - Production Presentation and Accessibility**: complete, including production art/audio, touch/accessibility, performance, save/recovery and browser/deployment hardening.
- **R7 - Daughter-led Expansion**: next; begins with Structured Preference Review before choosing the next major expansion path.

## Development rule

The repository is the source of truth. Work is divided into stable work-package IDs so development can resume in a new conversation by naming the next package without relying on chat history.
