import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdaptiveCandidate } from './adaptiveShardPlan.mjs';
import { selectTier3Matrix, validateManifestCandidate } from './tier3Matrix.mjs';
import { assignedShard, verifyManifestShardResult } from './runAdaptiveShard.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const files = Array.from({ length: 15 }, (_, i) => 'tests/play/runner-' + i + '.spec.ts');
const discovered = {
  schemaVersion: 1, mode: 'discovery',
  provenance: { sourceSha: A, headSha: B, runId: '123', shard: 'all/6' },
  files: files.map((path) => ({ path, tests: 2 })),
  tests: files.flatMap((file, i) =>
    ['one', 'two'].map((part) => ({ file, identity: i + ':' + part, status: 'discovered' }))),
  summary: { files: 15, tests: 30 },
};
const options = { sourceSha: A, headSha: B, runId: '123' };
const candidate = buildAdaptiveCandidate({ discovery: discovered, history: [], ...options });

function shardEvidence(id) {
  const selected = candidate.plans[6].shards[id - 1];
  return {
    schemaVersion: 1, mode: 'execution',
    provenance: { ...options, shard: id + '/6' },
    tests: selected.identities.map((identity) => ({
      identity, file: discovered.tests.find((item) => item.identity === identity).file,
      status: 'expected',
    })),
    summary: { tests: selected.identities.length, unexpected: 0, flaky: 0 },
  };
}

test('static-six remains default without any candidate artifacts', () => {
  const result = selectTier3Matrix({ ...options, canary: false });
  assert.equal(result.mode, 'static6');
  assert.equal(result.matrix.include.length, 6);
  assert.equal(result.matrix.include[5].shard, 6);
});

test('isolated canary accepts exact-cover six-shard file assignments', () => {
  assert.equal(validateManifestCandidate({ candidate, discovery: discovered, ...options }).length, 6);
  const plan = selectTier3Matrix({ canary: true, candidate, discovery: discovered, ...options });
  assert.equal(plan.mode, 'manifest6');
  assert.ok(plan.matrix.include.every((item) => item.total === 6));
  for (let id = 1; id <= 6; id++) {
    assert.ok(assignedShard({ candidate, discovery: discovered, ...options, shard: id }).files.length > 0);
    assert.equal(verifyManifestShardResult({
      candidate, discovery: discovered, evidence: shardEvidence(id), shard: id,
    }).shard, id);
  }
});

test('tampered candidate file, identity or SHA is rejected before launching browsers', () => {
  const foreign = structuredClone(candidate);
  foreign.plans[6].shards[0].files[0] = 'tests/play/foreign.spec.ts';
  assert.throws(() => validateManifestCandidate({
    candidate: foreign, discovery: discovered, ...options,
  }), /Foreign|duplicated/);
  const dropped = structuredClone(candidate);
  dropped.plans[6].shards[0].identities.pop();
  assert.throws(() => validateManifestCandidate({
    candidate: dropped, discovery: discovered, ...options,
  }), /identities/);
  const stale = structuredClone(candidate);
  stale.provenance.headSha = A;
  assert.throws(() => validateManifestCandidate({
    candidate: stale, discovery: discovered, ...options,
  }), /stale/);
  const moved = structuredClone(candidate);
  moved.plans[6].shards[0].files.push(moved.plans[6].shards[1].files[0]);
  assert.throws(() => validateManifestCandidate({
    candidate: moved, discovery: discovered, ...options,
  }), /duplicated/);
  const extra = structuredClone(candidate);
  extra.summary.recommendedCount = 12;
  assert.throws(() => validateManifestCandidate({
    candidate: extra, discovery: discovered, ...options,
  }), /unqualified/);
});

test('post-run audit rejects absent, wrong-file, duplicate, failed and stale identities', () => {
  const good = shardEvidence(1);
  const gone = structuredClone(good); gone.tests.pop();
  assert.throws(() => verifyManifestShardResult({ candidate, discovery: discovered, evidence: gone, shard: 1 }), /missing/i);
  const changed = structuredClone(good); changed.tests[0].file = files[14];
  assert.throws(() => verifyManifestShardResult({ candidate, discovery: discovered, evidence: changed, shard: 1 }), /Wrong/);
  const duplicate = structuredClone(good); duplicate.tests.push(good.tests[0]);
  assert.throws(() => verifyManifestShardResult({ candidate, discovery: discovered, evidence: duplicate, shard: 1 }), /duplicated/);
  const failed = structuredClone(good); failed.tests[0].status = 'unexpected';
  assert.throws(() => verifyManifestShardResult({ candidate, discovery: discovered, evidence: failed, shard: 1 }), /failed/);
  const stale = structuredClone(good); stale.provenance.runId = '125';
  assert.throws(() => verifyManifestShardResult({ candidate, discovery: discovered, evidence: stale, shard: 1 }), /Stale/);
});

test('skipped tests remain required and must be reported exactly once', () => {
  const skipped = shardEvidence(3);
  skipped.tests[0].status = 'skipped';
  assert.equal(verifyManifestShardResult({
    candidate, discovery: discovered, evidence: skipped, shard: 3,
  }).identities, skipped.tests.length);
});
