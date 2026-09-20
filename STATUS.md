# Project Status

Last updated: 2026-09-20

## Current work

`R6.5-WP19H2.11 - Responsive Polish, Consolidation & Hardening` is active on draft PR #175 /
branch `agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.10 are human-approved. David explicitly started H2.11 on 20 September 2026 and
authorised PR #175 to merge and deploy to `main` without a further approval stop once the complete
H2.11 technical gate is green.

## H2.11 candidate

Implementation candidate `cc8e30620a3fe51d85d254b5d983d88ab71a1c18` consolidates the finished cottage:

- removes the retired `CottageDepthWorldManager` and its duplicate global polling/interaction path;
- publishes cottage sleep, exit, Wonderbook, treasure, tactile home objects, visitors and decoration
  targets through the shared interaction registry/coordinator;
- preserves direct tap/click decoration spots with one canonical hit surface per slot;
- makes cottage decoration markers, treasure presentation and visiting-friend idles respect Reduced Motion;
- adds portrait touch companion controls to Decorate and Room Style using the established responsive UI;
- splits the historically long tablet creator/exploration/Book/accessibility browser journey into bounded
  regression contracts;
- adds focused H2.11 browser coverage for the consolidated interaction route, Reduced Motion and portrait
  cottage editing.

No save-schema, progression, race-balance, quest, reward or story-authority changes are intended.

## H2.11 CI remediation

Checkpoint `643eb4eb09fb2c0c077e77c9c1226bc5a030f2bb` repairs the exact-head browser failures from run
`35506640200` without restoring a cottage-specific interaction owner:

- cottage targets are published during scene creation and shared prompts now render each target’s
  canonical action label;
- ordinary cottage reactions route directly through `WorldFeedbackPresenter` rather than a transient
  legacy banner that diagnostics could miss;
- the portrait contract uses the established DOM Room Style control;
- a directly opened Settings scene now starts its requested return scene when Done is selected;
- focused H2.11, sleep and Reduced Motion/accessibility contracts pass locally. The H2.5 flow reaches
  its final accepted state locally but exceeds its historical 45-second limit under this container’s
  software-rendered browser; exact-head CI remains authoritative for that timing contract.

`npm run validate` passes (552 unit tests, build, static smoke and hard performance budget). Run `35508803762` against `ee565ad4d2d029e1e7fd5ac5e8bc98e8c881fe05` passed verification,
static/architecture, unit, build/smoke/performance, Chromium shard 2/3, cross-browser compatibility
and Cloudflare deployment. Its remaining failures were three browser-contract regressions: the WP18I
cottage-entry expectation retained the superseded `Enter` wording; the H2.6 editor-return regression
used a stale coordinate for Done; and the supporting-resident portrait occasionally exceeded its
six-second visibility wait under shard load.

Checkpoint `90e161c8795cab5b6496989d3edf9cd0db57e5d3` preserves the accepted runtime and repairs only those
contracts: WP18I now expects the canonical `Go inside` wording, the H2.6 flow uses the named
Decorate/Done control, and the resident portrait retains its exact identity assertions with a bounded
12-second presentation wait. The entry contract passed locally, and the portrait contract passed five
consecutive runs. The full H2.6 journey reaches the remediated assertion locally but remains slower than
its historical timeout under this container's software renderer; exact-head CI remains authoritative.
`npm run validate` passes with 552 unit tests and the hard performance budget. Runs `35510317417`
and `35510411086` then passed every gate except Chromium shard 3/3. Local reproduction showed that the
named Done control itself is correct, but restarting `CottageInteriorScene` directly from itself leaves
the diagnostic pointer journey in a synthetic lifecycle that real editor return never uses. Checkpoint
`bd6770d37d8d73f5167ebc354159425e019b2349` routes that regression through `MoonflowerGladeScene`
before the editor-return start, preserving the exact contract while exercising a genuine scene
shutdown/start. The complete H2.6 contract passes locally with the container timing override; exact-head
CI and Cloudflare deployment are pending publication of this checkpoint.

## Current gate

Run `35511897395` passed the complete H2.11 gate at
`0a8a1d631a4501e0ed81c897830984b912beea18`. The following status-only exact-head run `35512995118`
again passed static, unit, build/performance, cross-browser and Chromium shard 3/3, but shard 1/3
reproduced the supporting-resident portrait readiness timeout under aggregate load. Checkpoint
`5475ce9a819d8d2d6339fc6212b79fbda9cb0759` keeps the exact portrait/fallback identity assertions and
applies a bounded 20-second wait only to that async portrait presentation. Exact-head qualification is
running; H2.11 remains unmerged until every gate passes together. The required gate is:

1. verification plan and static/architecture policy;
2. complete unit suite;
3. production build, static smoke and performance budget;
4. focused H2.11 browser contracts;
5. all full Chromium shards;
6. Chromium/Firefox/WebKit compatibility;
7. exact-head Cloudflare branch deployment.

A genuine H2.11-owned regression must be repaired before merge. Pre-existing or flaky failures must be
reproduced and diagnosed rather than hidden by weakening coverage.

## Merge and deployment

PR #175 merged as main `e63be2f14290dbce394baf4c8e0a98f078f4e1bf` after exact-head run `35513888198`
passed every required gate at `35a0d60e0b05a80520e3105456f72434253abc47`. Cloudflare Pages reports the
merge SHA deployed successfully to production. The supported startup/save/reload/Continue smoke could
not be dispatched because the available GitHub token lacks workflow-dispatch permission, and direct
browser verification from this container is blocked by its outbound proxy (`ERR_TUNNEL_CONNECTION_FAILED`).
Production verification therefore remains explicit and incomplete rather than being inferred from the
successful deployment check.
