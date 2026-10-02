# Project Status

Last updated: 2026-10-02

## Current work

`R6.5-WP19H4 - Rainbow Meadow Final Polish` remains active.

The current implementation slice is **H4.7 - Rainbow Meadow race-extraction cleanup and entrance integration** on branch `r6-5-wp19h4-7-race-extraction-cleanup`.

H4.7 is temporarily stacked on the exact approved H4.6 head while H4.6 finishes its full-browser qualification.

Accepted context:

- H4.1-H4.5 are complete and merged.
- H4.6 gives Nova one authoritative modern presentation across Picnic Hill, Rainbow Run Race Hub, dialogue, cottage visits and race scenes.
- David explicitly approved the H4.6 Nova appearance on 2 October 2026.
- H4.6 PR #250 is ready for merge once its exact-head production browser qualification is clean. Core static, build/performance and unit gates are already green; one unrelated mobile movement timing run failed under the cross-browser load and is being treated as a qualification rerun rather than a Nova gameplay change.
- Crystal Brook's accepted traversal remains fully walkable water with collision only on physical rocks.

H4.7 currently owns:

- reclaiming the former Meadow race footprint as ordinary north-east countryside;
- moving the Rainbow Run Race Hub threshold to the north map edge;
- extending the authored Race Hub path beyond the map boundary;
- replacing the event-style pennant arch with a small wooden wayfinding sign;
- removing Meadow-side Race Hub post collision;
- preserving both explicit and walk-through Race Hub transitions through the canonical hub feature;
- proving the new gateway remains reachable across desktop, tablet and phone viewports.

H4.7 remains an **Amber human visual gate**. Do not merge H4.7 or begin H4.8 until David approves the deployed Meadow-side cleanup.

## Next work

After H4.7 is visually approved and merged, continue to **H4.8 - Nature micro-areas and interaction-affordance cleanup**.

The dedicated Rainbow Run Race Hub full maturity pass remains a post-H4 follow-on and must not expand H4.7 scope.

## Operating reminders

- Use the fast-development CI contract in `AGENTS.md`: cheap relevant checks during iteration, full exact-head qualification before merge.
- On a failed current-work CI run, inspect and remediate immediately when deterministic.
- If Git/GitHub access fails, attempt a fresh reconnect/status read before reporting an access blocker.
- Do not merge Amber visual work without explicit human approval.
