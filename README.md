# Unicorn Valley

A cosy browser-based unicorn life-adventure designed primarily for a seven-year-old player.

The player creates her own unicorn, lives at Moonflower Cottage, explores a magical valley, makes recurring friends, collects discoveries, decorates her home, enters races and sees the world remember what she has done.

## Project status

**R6 is complete and its final human playthrough hard stop has been released. R6.5 - Valley Completeness and Breadth is the active next release.**

R0 through R6 are complete. The R6-WP6.18 human playthrough produced several bounded remediation passes covering mobile creator/action clarity, click-navigation facing, Village shops/interiors, region gateways, Crystal Cascade balance, NPC-marker clean-up, map/path clean-up and mobile race controls. The final R6-WP6.18I/J confirmation verified reliable mobile Crystal Cascade entry and native-looking gateway path integration. Remaining observations were judged small enough for a later tidy-up rather than release blockers.

The project is deliberately **not moving into R7 yet**. The completed R6 build is polished and playable, but the valley is still too sparse for a preference-led daughter review to be a fair comparison between play styles. There are not yet enough places, quests, races, useful shop interactions, supporting unicorns and repeatable activities.

R6.5 is therefore a mandatory content-completion phase. It deepens every existing region, adds supporting residents and world interactions, completes shops/economy/rewards, increases quest and race breadth, adds non-racing activities, expands the Wonderbook and promotes Starlight Beach into a full content-bearing production region. Supporting residents are also expected to make the valley visibly alive through purposeful autonomous routines rather than existing mainly as static quest markers.

R7-WP7.1 remains blocked until **R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate** is explicitly released.

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
- [R6-WP6.18I/J Final Gate and Path Fixes](docs/07U-R6-WP6.18I-J-FINAL-GATE-PATH-FIXES.md)
- [R6.5 Valley Completeness and Breadth](docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md)
- [R6.5 Content Blueprint](docs/07W-R6.5-CONTENT-BLUEPRINT.md)
- [R6.5 Autonomous Unicorn Life Contract](docs/07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md)
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
- **R6 - Production Presentation and Accessibility**: complete, including the R6-WP6.18 human remediation/release gate.
- **R6.5 - Valley Completeness and Breadth**: active next release; `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md` is the primary phase contract, with `docs/07W-R6.5-CONTENT-BLUEPRINT.md` and `docs/07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md` as mandatory companion specifications for the relevant packages.
- **R7 - Daughter-led Expansion**: blocked until R6.5-WP17 explicitly confirms the game has enough breadth for meaningful preference-led observation.

## Development rule

The repository is the source of truth. Work is divided into stable work-package IDs so development can resume in a new conversation by naming the next package without relying on chat history.
