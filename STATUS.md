# Project Status

Last updated: 2026-09-11

## Current work

`R6.5-WP19D - Unified interactions and reliable NPC engagement`

Path: `docs/work-packages/R6.5-WP19D-UNIFIED-INTERACTIONS-NPCS.md`

State: **corrected candidate technically qualified and waiting at David's human review gate**. Runtime candidate `8c4c995c654dda2168d82610eeb07b5d6ff8208f` is published at `https://a13f68a2.unicorn-valley.pages.dev`. PR #164 remains draft and unmerged.

The remediation preserves the accepted unified interaction architecture and fixes the live-review defects: desktop touchscreen laptops no longer show the mobile movement pad merely because touch hardware exists; visible unicorn residents now have physical separation from the player while preserving roaming behaviour; conversation presentation owns the protected lower-screen speech area and suppresses overlapping contextual interaction UI; discovery/reward feedback is kept out of the top HUD and deferred while conversation owns the lower area; and Starlight Beach retains the canonical exploration HUD rather than a Beach-specific replacement.

## Technical qualification

- Exact runtime-head CI run `34580599114` passed Validate, Browser playtest 1/3, 2/3 and 3/3, and Browser compatibility.
- AI project-contract run `34580599030` passed for the runtime candidate.
- The corrected deployment manifest points to `https://a13f68a2.unicorn-valley.pages.dev` at runtime SHA `8c4c995c654dda2168d82610eeb07b5d6ff8208f`.
- Manifest-bound immutable deployment smoke run `34582809440` passed against that exact URL/SHA. Startup, save, reload and Continue passed in isolated storage, and artifact `10192333128` records the smoke evidence.
- Operating-contract validation run `34582809494` passed after the project state was aligned with the repository's allowed status values.

Earlier smoke run `34580599195` passed against the stale WP19C manifest and is retained only as historical evidence; it is not counted as WP19D qualification.

## Human feedback and gate

David's first WP19D review accepted the interaction direction and specifically confirmed that contextual interaction, NPC stop/face behaviour, distance gating and general NPC behaviour were materially improved. The candidate was rejected for merge until desktop control ownership, NPC physical presence, lower-screen conversation ownership, discovery placement and Starlight Beach HUD were remediated. Those bounded fixes are now implemented and automatically qualified.

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

Stop for David's WP19D re-review. On explicit approval, merge PR #164, verify production deployment, and move to `R6.5-WP19E - Conversation feedback`.
