import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdaptiveCandidate, verifyAdaptiveExecution } from './adaptiveShardPlan.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const paths = Array.from({ length: 15 }, (_, i) => 'tests/play/fixture-' + String(i).padStart(2, '0') + '.spec.ts');

function discovery(files = paths) {
  const tests = files.map((file, i) => ({ file, identity: 'id:' + i, status: 'discovered' }));
  return {
    schemaVersion: 1, mode: 'discovery',
    provenance: { sourceSha: A, headSha: B, runId: '123', shard: 'all/6' },
    tests,
    files: files.map((path) => ({ path, tests: 1 })),
    summary: { tests: tests.length, files: files.length },
  };
}

function health(id = '99', files = paths) {
  const records = files.map((path, i) => ({
    kind: 'browser', path, observed: true, tests: 1,
    expected: 1, unexpected: 0, flaky: 0, skipped: 0,
    durationMs: i === 0 ? 100000 : 1000 * (i + 1),
  }));
  return {
    schemaVersion: 1, valid: true, errors: [],
    provenance: { sourceSha: A, headSha: A, runId: id },
    records, summary: {
      observedBrowserSpecs: files.length, unobservedBrowserSpecs: 0,
      inventoryBrowserSpecs: files.length,
    },
  };
}

const plan = (args = {}) => buildAdaptiveCandidate({
  discovery: discovery(), history: [health()], sourceSha: A,
  headSha: B, runId: '123', ...args,
});

test('six-shard fallback is the only unqualified live proposal even with healthy timings', () => {
  const candidate = plan();
  assert.equal(candidate.summary.discoveredFiles, 15);
  assert.equal(candidate.summary.discoveredIdentities, 15);
  assert.equal(candidate.summary.recommendedCount, 6);
  assert.equal(candidate.proposedMatrix.include.length, 6);
  assert.equal(candidate.summary.nonSixActivationEligible, false);
  for (const count of [6, 8, 10, 12]) {
    const shards = candidate.plans[count].shards;
    const observed = shards.flatMap((shard) => shard.files);
    assert.deepEqual(observed.sort(), [...paths].sort());
    assert.equal(new Set(observed).size, 15);
  }
});

test('new, renamed and removed files follow discovery, not historical ownership', () => {
  const input = discovery([...paths.slice(1), 'tests/play/new-safe.spec.ts']);
  const candidate = plan({ discovery: input });
  assert.equal(candidate.summary.unknownFiles, 1);
  assert.ok(candidate.plans[6].shards.some((shard) => shard.files.includes('tests/play/new-safe.spec.ts')));
});

test('deterministic tie-breaking independent of discovery order', () => {
  const first = plan();
  const files = [...paths].reverse();
  const changed = discovery(files);
  changed.tests = [...discovery().tests].reverse();
  const second = plan({ discovery: changed });
  assert.deepEqual(first.plans[6], second.plans[6]);
});

test('invalid, cancelled, failed, mismatched or duplicate history cannot enable non-six', () => {
  const dup = health();
  const cancelled = health('98'); cancelled.valid = false;
  const failed = health('97'); failed.records[0].expected = 0; failed.records[0].unexpected = 1;
  const sha = health('96'); sha.provenance.headSha = B;
  const candidate = plan({ history: [health(), dup, cancelled, failed, sha], activate: true, allowMeasuredNonSix: true });
  assert.equal(candidate.summary.cleanHistoryRuns, 1);
  assert.equal(candidate.summary.nonSixActivationEligible, false);
  assert.equal(candidate.summary.rejectedHistory.length, 4);
});

test('source SHA/run tampering and duplicated discovery test identities fail closed', () => {
  assert.throws(() => plan({ sourceSha: 'c'.repeat(40) }), /stale/);
  assert.throws(() => plan({ runId: '124' }), /stale/);
  const input = discovery(); input.tests[1].identity = input.tests[0].identity;
  assert.throws(() => plan({ discovery: input }), /duplicate/);
  const missing = discovery(); missing.tests.pop();
  assert.throws(() => plan({ discovery: missing }), /summary/);
});

test('unequal severe skew and unknown-duration fallback do not leave shards empty', () => {
  const candidate = plan({ history: [] });
  assert.equal(candidate.summary.unknownFiles, 15);
  assert.ok(candidate.plans[12].shards.every((shard) => shard.files.length > 0));
  assert.ok(candidate.plans[12].shards.every((shard) => shard.durationMs >= 120000));
});

function executionFromPlan(candidate, input) {
  const count = candidate.summary.recommendedCount;
  return candidate.plans[count].shards.map((s) => ({
    mode: 'execution',
    provenance: { ...candidate.provenance, shard: s.id + '/' + count },
    tests: s.identities.map((identity) => ({
      identity, file: input.tests.find((t) => t.identity === identity)?.file,
      status: 'expected',
    })),
  }));
}

test('post-run reconciliation rejects missing, wrong-shard, repeated and failed test identities', () => {
  const input = discovery();
  const candidate = plan();
  const shards = executionFromPlan(candidate, input);
  assert.deepEqual(verifyAdaptiveExecution({ discovery: input, candidate, shards }),
    { complete: true, identities: 15, shards: 6 });
  const missing = structuredClone(shards); missing[0].tests.pop();
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards: missing }), /Missing/);
  const swapped = structuredClone(shards); swapped[0].tests[0].identity = shards[1].tests[0].identity;
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards: swapped }), /wrongly assigned/);
  const failed = structuredClone(shards); failed[0].tests[0].status = 'unexpected';
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards: failed }), /failed/);
  const stale = structuredClone(shards); stale[0].provenance.headSha = A;
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards: stale }), /stale/);
  const repeat = structuredClone(shards); repeat[0].tests.push(repeat[0].tests[0]);
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards: repeat }), /repeated/);
});

test('manual non-six mode is still blocked without multiple independently accepted reports', () => {
  const candidate = plan({ activate: true, allowMeasuredNonSix: true,
    history: [health('50'), health('51')] });
  assert.equal(candidate.summary.recommendedCount, 6);
  assert.equal(candidate.summary.nonSixActivationEligible, false);
});

test('no number of clean historical reports can bypass the candidate-only safety lock', () => {
  const candidate = plan({
    history: [health('80'), health('81'), health('82'), health('83')],
    activate: true, allowMeasuredNonSix: true,
  });
  assert.equal(candidate.summary.cleanHistoryRuns, 4);
  assert.equal(candidate.summary.recommendedCount, 6);
  assert.equal(candidate.summary.nonSixActivationEligible, false);
});

test('path traversal and forged execution file references fail closed', () => {
  const bad = discovery();
  bad.tests[0].file = 'tests/play/../../unexpected.spec.ts';
  assert.throws(() => plan({ discovery: bad }), /invalid/);
  const input = discovery();
  const candidate = plan();
  const shards = executionFromPlan(candidate, input);
  shards[0].tests[0].file = paths[1];
  assert.throws(() => verifyAdaptiveExecution({ discovery: input, candidate, shards }), /wrongly assigned/);
});
