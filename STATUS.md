# Project Status

Last updated: 2026-09-27

## Current work

`R6.5-WP19H3 - Sunbeam Village Final Polish` remains active.

**H3.11-R2 - Wobbly Cake baking mini-game is human-approved.** David approved the R2/R2A/R2B playtest result on 27 September and explicitly authorised full qualification followed by merge to `main` if green.

The accepted R2 baseline is the skill-based Wobbly Cake loop on PR **#183**:

- choose Sunshine, Moonflower or Rainbow recipe;
- measure ingredients against recipe marks;
- stir by tracing inside the batter with live spoon/pointer tracking;
- stack three sponge layers using strict ordered drag-and-drop;
- trace icing and choose topping/finish;
- receive a forgiving Wobble Score with no hard failure state;
- first quest cake remains free and preserves the approved Maple/Marigold progression contract;
- post-quest repeat baking uses the same Bakery cake table, requires explicit confirmation to spend 1 Shimmer, and pays 1–3 Shimmer for the finished cake;
- the legacy floating `Bake with Maple` entry and result-screen rebake shortcut are removed.

R2A corrected tablet geometry, enforced supported layer order and introduced the repeat-bake payment gate. R2B moved the stirring guide fully inside the batter and added continuous touch/mouse tracking with a visible live trace.

The approved implementation head before closeout documentation is `494ca612fd4fa0b48cea1791acccba3cff88568f`. PR **#183** remains the delivery owner. It must receive one exact-head full qualification covering static/architecture, full unit contracts, build/performance, all Chromium shards and cross-browser compatibility before merge.

After R2 is merged, the next bounded Sunbeam slice is **H3.11.5 - Rosehip Cottage**. Do not begin it before the R2 merge gate is complete.

## Completed Sunbeam slices

- H3.1-H3.10: complete and human-approved.
- H3.11.1: complete and human-approved.
- H3.11.2 Sunbeam Bakery: implementation complete; Bakery/Picnic progression defects closed through approved H3.11-R1 remediation.
- H3.11.3 Twinkle & Thread: complete and human-approved.
- H3.11-R1 Bakery/Picnic remediation: complete and human-approved.
- H3.11.4 Story House A-F: complete and human-approved; merged through PR #181.
- H3.11-R2 Wobbly Cake mini-game: human-approved; PR #183 awaiting final exact-head full qualification and merge.
- H3.11.5-H3.11.10: planned after R2.
- H3.12: planned wider presence-coherence pass.

## Numbering rule

Do not pre-allocate a final hardening/cleanup number. The final consolidation, responsive regression, hardening, documentation and integrated H3 qualification slice receives the next unused H3 number only after David explicitly confirms that substantive Sunbeam Village work is complete.

Sunbeam Village remains a review lens, not a technical boundary. Shared defects discovered during implementation must be fixed at their canonical shared owner rather than through village-specific workarounds.
