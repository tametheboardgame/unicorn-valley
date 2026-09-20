# Project Status

Last updated: 2026-09-20

## Current state

R6.5-WP19H2 – Moonflower Cottage & Home Customisation is complete and deployed to production.

H2.0 through H2.11 are complete. The final H2.11 exact-head candidate `35a0d60e0b05a80520e3105456f72434253abc47` passed the complete qualification matrix in CI run `35513888198`, including static/architecture policy, unit contracts, production build/static smoke/performance, all three full Chromium shards and Chromium/Firefox/WebKit compatibility.

PR #175 was merged to `main` as `e63be2f14290dbce394baf4c8e0a98f078f4e1bf` after that green gate. Cloudflare successfully deployed the merged H2 production build on 20 September 2026.

## Post-merge verification

A subsequent main-branch browser run exposed a stale supporting-resident dialogue contract unrelated to H2 runtime behaviour. The test was corrected to isolate Juniper from Pip's first-arrival flow and activate Juniper through the visible shared interaction prompt. The targeted verification for that fix passed and PR #177 was merged as `902f1447ecd82cc5f70e7ea8e9288b547215f683`.

No unfinished H2 gameplay, persistence, responsive, accessibility or cottage-integration scope remains.

## H2 delivered state

The production cottage now preserves the approved H2 architecture and behaviour:

- canonical semantic room/story/visitor anchors;
- production room shell, furniture, collision and Y-aware layering;
- bed/sleep flow integrated with the shared atmospheric time service;
- clean normal play plus dedicated Decorate mode;
- persistent wall, wallpaper, floor and furniture styling;
- starter and unlockable home-style entitlements;
- place / replace / move / remove decoration flows with persistence;
- strange egg and future story/portal capacity bound to semantic anchors;
- consolidated shared interaction ownership with obsolete cottage-specific paths removed;
- responsive desktop/tablet/phone controls and Reduced Motion behaviour;
- final automated browser, cross-browser and performance qualification.

## Next work

There is no active work package recorded after H2. Start the next package only when explicitly selected.
