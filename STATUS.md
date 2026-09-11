# Project Status

Last updated: 2026-09-11

## Current work

`R6.5-WP19D - Unified interactions and reliable NPC engagement`

Path: `docs/work-packages/R6.5-WP19D-UNIFIED-INTERACTIONS-NPCS.md`

State: **corrected review candidate ready at the human gate**. The runtime candidate is `8c4c995c654dda2168d82610eeb07b5d6ff8208f`, published by Cloudflare at `https://a13f68a2.unicorn-valley.pages.dev`. PR #164 remains draft and unmerged.

The remediation preserves the accepted unified interaction architecture and fixes the live-review defects: desktop touchscreen laptops no longer show the mobile movement pad merely because touch hardware exists; visible unicorn residents now have physical separation from the player while preserving roaming behaviour; conversation presentation owns the protected lower-screen speech area and suppresses overlapping contextual interaction UI; discovery/reward feedback is moved out of the top HUD and deferred while conversation owns the lower area; and Starlight Beach retains the canonical exploration HUD rather than a Beach-specific replacement.

## Technical qualification

- Exact runtime-head CI run `34580599114` is green: Validate, Browser playtest 1/3, 2/3 and 3/3, and Browser compatibility all passed.
- AI project-contract run `34580599030` passed.
- The replacement WP19D acceptance tests that previously failed due to browser-harness defects now pass in the full matrix.
- The immutable deployment manifest now targets `https://a13f68a2.unicorn-valley.pages.dev` at runtime SHA `8c4c995c654dda2168d82610eeb07b5d6ff8208f`. Only a smoke run resolved from this corrected manifest counts as WP19D deployment evidence. Earlier smoke run `34580599195` passed against the stale WP19C manifest and is retained only as historical evidence, not as WP19D qualification.

## Human feedback and gate

David's first WP19D review accepted the interaction direction and specifically confirmed that contextual interaction, NPC stop/face behaviour, distance gating and general NPC behaviour were materially improved. The candidate was rejected for merge until desktop control ownership, NPC physical presence, lower-screen conversation ownership, discovery placement and Starlight Beach HUD were remediated. Those bounded fixes are now implemented and automatically covered.

The remaining gate is David's corrected-candidate re-review. Do not merge PR #164, deploy WP19D to production, or start WP19E until that approval is explicit.

## Accepted sequence

WP19A persistence safety → WP18K ownership foundation → WP19B world boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F UI consistency/generated title → WP19G/H MP3 audio → WP19I integrated qualification → WP18H daughter replay → WP17 readiness decision.

WP19A, WP18K, WP19B and WP19C are integrated. WP19D is at its human gate. WP19E is next after approval. R7 remains blocked until the R6.5 qualification/replay/readiness gates complete.

## Production baseline

Production remains on the merged WP19C baseline at main `1a622dbecf52ca79a378c51e417c8e4d4cc6f6ea`. The corrected WP19D candidate is review-only and must not be merged or promoted until the human gate passes.

## Review candidate

Immutable preview: `https://a13f68a2.unicorn-valley.pages.dev`

Branch preview: `https://agent-r6-5-wp19d-unified-int.unicorn-valley.pages.dev`

Draft PR: `https://github.com/tametheboardgame/unicorn-valley/pull/164`

## Next action

Confirm the corrected manifest-bound immutable smoke completes successfully, then stop for David's WP19D re-review. On explicit approval, merge PR #164, verify production deployment, and move to `R6.5-WP19E - Conversation feedback`.
