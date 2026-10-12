import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectHistory,
  eligibleHistoryRuns,
  validateHistoricalHealth,
} from './fetchSuiteHealthHistory.mjs';

const sha = 'a'.repeat(40);
const run = (id, values = {}) => ({
  id,
  head_branch: 'main',
  event: 'push',
  status: 'completed',
  conclusion: 'success',
  head_sha: sha,
  ...values,
});
const snapshot = (id) => ({
  schemaVersion: 1,
  valid: true,
  errors: [],
  provenance: { runId: String(id), sourceSha: sha, headSha: sha, shard: 'all/6' },
  records: [
    {
      path: 'tests/play/one.spec.ts',
      kind: 'browser',
      tests: 2,
      expected: 1,
      unexpected: 1,
      flaky: 0,
      skipped: 0,
      durationMs: 200,
    },
  ],
});

test('only completed main runs are historical; failed runs retain valid failure evidence', () => {
  const data = [
    run(1),
    run(2, { status: 'in_progress' }),
    run(3, { head_branch: 'feature' }),
    run(4, { conclusion: 'cancelled' }),
    run(5, { event: 'pull_request' }),
    run(6, { conclusion: 'failure' }),
  ];
  assert.deepEqual(
    eligibleHistoryRuns(data, 1).map((x) => x.id),
    [6],
  );
});

test('history must match GitHub run identity, SHA and complete per-spec counters', () => {
  assert.equal(validateHistoricalHealth(snapshot(10), run(10)).valid, true);
  assert.throws(() => validateHistoricalHealth(snapshot(10), run(11)), /incomplete or not bound/);
  assert.throws(
    () =>
      validateHistoricalHealth(
        { ...snapshot(10), records: [...snapshot(10).records, snapshot(10).records[0]] },
        run(10),
      ),
    /duplicated/,
  );
  const bad = snapshot(10);
  bad.records[0].flaky = -1;
  assert.throws(() => validateHistoricalHealth(bad, run(10)), /Invalid/);
});

test('collector skips missing, expired or invalid artifacts instead of inventing trends', async () => {
  const results = await collectHistory({
    runs: [run(20), run(19), run(18)],
    currentRunId: '21',
    lookupArtifacts: async (id) => ({
      artifacts: id === 19 ? [] : [{ name: 'suite-health', id, expired: false }],
    }),
    downloadReport: async (id) => (id === 20 ? snapshot(20) : snapshot(999)),
  });
  assert.equal(results.reports.length, 1);
  assert.equal(results.reports[0].provenance.runId, '20');
  assert.equal(results.notes.length, 2);
  assert.deepEqual(
    results.notes.map((note) => note.runId),
    ['19', '18'],
  );
});

test('five-run limit and duplicate/current exclusion are deterministic', async () => {
  const results = await collectHistory({
    runs: Array.from({ length: 8 }, (_, index) => run(107 - index)),
    currentRunId: '107',
    lookupArtifacts: async (id) => ({
      artifacts: [{ name: 'suite-health', id, expired: false }],
    }),
    downloadReport: async (id) => snapshot(id),
  });
  assert.deepEqual(
    results.reports.map((item) => item.provenance.runId),
    ['106', '105', '104', '103', '102'],
  );
});
