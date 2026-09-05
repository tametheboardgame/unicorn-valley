# Operating Roadmap

This file is the concise project-level navigation layer. Detailed release content remains authoritative in the existing design documents under `docs/`.

## Completed releases

- R0 - Foundation and Pre-production: complete.
- R1 - My Unicorn: First Playable: complete.
- R2 - Living Valley Vertical Slice: complete.
- R3 - Rainbow Run Racing: complete.
- R4 - Friendship, Secrets and Home Depth: complete.
- R5 - The Valley Gets Bigger: complete.
- R6 - Production Presentation and Accessibility: complete, including the final human remediation gate.

## R6.5 - Valley Completeness and Breadth

Status: Waiting at final human readiness gate

Canonical release contract: `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`

Mandatory companion material where relevant:

- `docs/07W-R6.5-CONTENT-BLUEPRINT.md`
- `docs/07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md`
- `docs/07Y-R6.5-WP1-AUDIT-DENSITY-CONTRACT.md`

Current package sequence:

- R6.5-WP1 - Valley Content Audit and Density Contract: complete.
- R6.5-WP2 - Ambient Population and World Interaction Toolkit: complete.
- R6.5-WP3 - Economy and Reward Loop Completion: complete.
- R6.5-WP4 - Sunbeam Village Life, Shops and Interiors: complete.
- R6.5-WP5 - Moonflower Glade and Cottage Depth: complete.
- R6.5-WP6 - Rainbow Meadow and Rainbow Run Depth: complete.
- R6.5-WP7 - Crystal Brook Depth: complete.
- R6.5-WP8 - Whispering Woods Depth: complete.
- R6.5-WP9 - Starlight Beach Core: complete.
- R6.5-WP10 - Starlight Beach Content: complete.
- R6.5-WP11 - Existing Valley Quest Pack A: complete.
- R6.5-WP12 - Race Expansion and Rainbow Cup: complete; merged as `610216ae13b96772d3a7b7e95696c695ddcd1870`.
- R6.5-WP13 - Quest Pack B: Cross-Region and Follow-up Stories: complete; merged as `3db374dd48445386819d1da97d4367619f7b9cef`.
- R6.5-WP14 - Repeatable Activity Expansion: complete; merged as `5d246ae012ef351e9dd356befc3a9608222041e6`.
- R6.5-WP15 - Wonderbook, Collections and Long-Term Goals: complete; merged as `bdc86e05472d0f061e3b748cc42706cc6541f523`.
- R6.5-WP16 - Valley Tidy-up, Balance and Content Polish: complete through PR #145 after final exact-head technical validation.
- R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate: **waiting for human playtest and explicit readiness approval**.

R6.5-WP17 is the final release gate. Automated work must stop here unless the human playthrough produces bounded R6.5 remediation work.

## R7 - Daughter-led Expansion

Status: Blocked

R7-WP7.1 may not begin until R6.5-WP17 explicitly confirms through human play that the valley has sufficient breadth for preference-led evidence to be meaningful.

## Future releases

Potential later work including flight/Cloudtop Peaks, deeper gardening, deeper cooking, companion expansion, further regions and festival systems remains backlog until later play evidence justifies it.

## Operating rules

- Build dependencies before content that uses them.
- Prefer reusable systems over repeated bespoke implementations.
- Production art follows proven mechanics unless concept work is explicitly required.
- Any new feature should strengthen a design pillar and add a meaningful player action rather than complexity alone.
- Detailed implementation belongs in bounded files under `docs/work-packages/` and the relevant canonical domain specifications.
- The hard application-entry performance budget remains 520 KiB and must not be weakened or increased.
- Production deployment requires explicit user approval.
