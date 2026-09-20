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
15-second presentation wait. The entry contract passed locally, and the portrait contract passed five
consecutive runs. The full H2.6 journey reaches the remediated assertion locally but remains slower than
its historical timeout under this container's software renderer; exact-head CI remains authoritative.
`npm run validate` passes with 552 unit tests and the hard performance budget. Exact-head CI and
Cloudflare deployment are pending publication of the durable checkpoint.

## Current gate

Exact-head H2.11 qualification is pending on the branch update. The required gate is:

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

PR #175 remains draft and unmerged until the full H2.11 gate is green. Once green, David has already
authorised marking the PR ready, merging to `main`, monitoring the production deployment and verifying
the deployed main build without another approval checkpoint.
