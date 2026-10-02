# Project Status

Last updated: 2026-10-02

## Current work

`R6.5-WP19H4 - Rainbow Meadow Final Polish` remains active.

The current bounded slice is **H4.6 - Nova final character redesign and presentation unification** on branch `r6-5-wp19h4-6-nova-redesign`.

Accepted context:

- H4.1-H4.4 are complete and merged.
- H4.5 rebuilt Picnic Hill as one canonical south-central destination, moved Marigold/Nova/Maple with the whole picnic system, and fixed blanket depth so characters render above ground picnic art.
- David explicitly approved H4.5 on 2 October 2026 and PR #248 merged to `main` as squash commit `a361f90639befad8cc36f26463b56d5cd3088cd7`.
- Crystal Brook's final accepted traversal remains fully walkable water with collision only on physical rocks.

H4.6 currently owns:

- one authoritative modern Nova appearance using the shared current unicorn renderer;
- bright pink body, blue/violet racing hair, gold/star accents and sporty identity;
- the same Nova source for Rainbow Run Race Hub, Picnic Hill, dialogue portraits, cottage friend visits and race presentation;
- deprecation of the old independent `NovaIdentity` generator;
- removal of runtime hiding/label logic whose purpose was to mask older Nova generations;
- preservation of `CoreNpcPresenceService`, first-race progression and race mechanics;
- deployed visual review before merge.

This remains an **Amber human visual gate**. Do not merge H4.6 or begin H4.7 until David approves the deployed Nova result.

## Next work

After H4.6 is visually approved and merged, continue to **H4.7 - Rainbow Meadow race-extraction cleanup and entrance integration**.

The dedicated **Rainbow Run Race Hub full maturity pass** remains a post-H4 follow-on and must not expand H4.6/H4.7 scope.

## Operating reminders

- Use the fast-development CI contract in `AGENTS.md`: cheap relevant checks during iteration, full exact-head qualification before merge.
- On a failed current-work CI run, inspect and remediate immediately when deterministic.
- If Git/GitHub access fails, attempt a fresh reconnect/status read before reporting an access blocker.
- Do not merge Amber visual work without explicit human approval.
