# Project Status

Last updated: 2026-09-26

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` remains active.

**H3.11.4 Story House is complete and human-approved.** The accepted A-F programme now includes the walkable Story House and Quill, a content-driven long-form library, DOM reader, durable multi-book reading progress/preferences, the illustrated/paged *Duck Bread Baker* path, scalable search/filter discovery, compact catalogue UX, Continue Reading and Valley Story Cards surfaces, concise catalogue blurbs, and equal reader navigation.

The final reader also supports left/right gutter taps and horizontal swipes for page turns while retaining the visible Previous/Next controls. The interaction-modal close path was hardened so closing the reader cannot leak the same click into Bag/Map/Book/Settings controls underneath.

The final approved implementation head was `82dec6e91305d9eed962da46c8af52873a0e98a5`. CI run **#4010** passed the static/architecture gate, unit contracts, production build/static smoke/performance checks, all three full Chromium shards and cross-browser compatibility. PR **#181** then merged the approved work to `main` as `52069b8e36311e14276c2115f3515dfa52f2adb0`.

H3.11-R1 Bakery/Picnic remediation is also complete and human-approved. It preserves Maple for the Wobbly Cake story until completion, gates Marigold's picnic correctly, fixes village NPC positioning/interaction overlap, and leaves the temporary cake flow usable until the proper mini-game replaces it.

## Next bounded slice

**H3.11-R2 - Wobbly Cake baking mini-game** is next, before H3.11.5 Rosehip Cottage.

R2 must replace the temporary Wobbly Cake menu/choice flow with a forgiving, child-friendly cake-making/decorating activity while preserving the existing Maple quest, rewards, save state and R1 picnic dependency. Repeatability after quest completion is a planning decision, not an assumed economy loop.

After R2 approval, continue with the already-numbered H3.11.5-H3.11.10 interior/content programme. H3.12 remains reserved for wider cross-region recurring-character presence coherence.

## Completed Sunbeam slices

- H3.1-H3.10: complete and human-approved.
- H3.11.1: complete and human-approved.
- H3.11.2 Sunbeam Bakery: implementation complete; Bakery/Picnic progression defects closed through approved H3.11-R1 remediation.
- H3.11.3 Twinkle & Thread: complete and human-approved.
- H3.11-R1 Bakery/Picnic remediation: complete and human-approved.
- H3.11.4 Story House A-F: complete and human-approved; merged through PR #181.
- H3.11-R2 Wobbly Cake mini-game: next.
- H3.11.5-H3.11.10: planned after R2.
- H3.12: planned wider presence-coherence pass.

## Numbering rule

Do not pre-allocate a final hardening/cleanup number. The final consolidation, responsive regression, hardening, documentation and integrated H3 qualification slice receives the next unused H3 number only after David explicitly confirms that substantive Sunbeam Village work is complete.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.
