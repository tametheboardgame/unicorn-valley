# ENG-WP3.3 static-six rollback qualification trial

This file exists only on the isolated rollback-validation PR targeting the WP3.3 branch. No game, test, CI or production change is made in this branch.

The target branch's guarded Tier 3 matrix **must** select `static6` for any pull request other than PR #316. This Ready-for-Review PR deliberately triggers the authoritative full workflow and verifies the negative branch of the actual GitHub selector using all six Playwright `--shard=N/6` jobs.

**Pass criteria**: selection log explicitly says `static6`; each of six full static shards finishes green; WP3.1 311/311 or live discovery count reconciles; Tier 4 retains seven profiles; required Merge Gate passes exact-head checks. Record the run ID and measurements in the parent WP3.3 package after completion. This PR is an isolated test and is **not intended to merge** into WP3.3 or `main`.

If it fails, retain PR #316 in draft and fix source-bound selection or the fallback. If the test is green, close this trial PR, retain its CI evidence and proceed to compare performance and final package review.
