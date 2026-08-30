# Unicorn Valley

A cosy browser-based unicorn life-adventure designed primarily for a seven-year-old player.

The player creates her own unicorn, lives at Moonflower Cottage, explores a magical valley, makes recurring friends, collects discoveries, decorates her home, enters races and sees the world remember what she has done.

## Project status

**R6-WP6.18 - Full Playthrough Hard Stop and Pre-R7 Review is active.**

R0 through R5 are complete. R6 now includes the original production presentation/accessibility programme, mobile portrait remediation, and the complete pre-R7 delight/personalisation extension through R6-WP6.17.

The first R6-WP6.18 human playthrough found a bounded set of mobile UX, movement presentation, environment/shop presentation, NPC marker and Crystal Cascade balance defects. Those findings have been remediated and merged through R6-WP6.18A/B to R6-WP6.18F, with shared CI gate hardening completed separately.

The project is deliberately **not moving into R7 yet**. The repaired build requires another meaningful human playthrough and explicit release of the R6-WP6.18 hard stop. New defects found during that replay may still be handled as bounded R6-WP6.18 remediation packages.

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
- [R6 Production Presentation Implementation Log](docs/07D-R6-IMPLEMENTATION-LOG.md)
- [R6 Mobile Portrait Playability Remediation](docs/07E-R6-WP6.10-MOBILE-PORTRAIT-REMEDIATION.md)
- [R6 Pre-R7 Delight and Personalisation Phase](docs/07F-R6-WP6.11-6.18-PRE-R7-DELIGHT-PHASE.md)
- [R6-WP6.18 Playthrough Status and Remediation Record](docs/07R-R6-WP6.18-PLAYTHROUGH-STATUS.md)
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

## Release plan

- **R0 - Foundation and Pre-production**: complete.
- **R1 - My Unicorn: First Playable**: complete.
- **R2 - Living Valley Vertical Slice**: complete.
- **R3 - Rainbow Run Racing**: complete.
- **R4 - Friendship, Secrets and Home Depth**: complete.
- **R5 - The Valley Gets Bigger**: complete.
- **R6 - Production Presentation and Accessibility**: implementation complete through R6-WP6.17; R6-WP6.18 human playthrough/review gate remains active with the first remediation cycle complete.
- **R7 - Daughter-led Expansion**: blocked until R6-WP6.18 is explicitly released; it will begin with Structured Preference Review before choosing the next major expansion path.

## Development rule

The repository is the source of truth. Work is divided into stable work-package IDs so development can resume in a new conversation by naming the next package without relying on chat history.
