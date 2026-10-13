import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateByDuration, makeShadowReport, validateCleanSnapshot, formatShadowReport } from './shadowShardPlanner.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const paths = Array.from({ length: 15 }, (_, i) => `tests/play/shadow-${String(i).padStart(2, '0')}.spec.ts`);

function snapshot(id = '101', sha = A, files = paths) {
  const records = files.map((path, i) => ({
    path, kind: 'browser', observed: true, tests: 2,
    expected: 2, skipped: 0, unexpected: 0, flaky: 0,
    durationMs: 1000 + i * 2000,
  }));
  return {
    schemaVersion: 1, valid: true, errors: [],
    provenance: { sourceSha: sha, headSha: sha, runId: id, shard: 'all/6' },
    records,
    summary: { observedBrowserSpecs: records.length,
      inventoryBrowserSpecs: records.length, unobservedBrowserSpecs: 0 },
  };
}

function shards(snap) {
  const browser = snap.records.filter((r) => r.kind === 'browser');
  return Array.from({ length: 6 }, (_, index) => ({
    mode: 'execution',
    provenance: { ...snap.provenance, shard: `${index + 1}/6` },
    tests: browser.flatMap((file, i) =>
      i % 6 === index
        ? [
            { file: file.path, identity: `${i}:one`, status: 'expected', durationMs: file.durationMs / 2 },
            { file: file.path, identity: `${i}:two`, status: 'expected', durationMs: file.durationMs / 2 },
          ]
        : [],
    ),
  }));
}

test('all 6/8/10/12 models cover every file exactly once without changing the static-six baseline', () => {
  const input = snapshot();
  const report = makeShadowReport({ current: input, shards: shards(input) });
  assert.equal(report.mode, 'shadow-only-no-execution-authority');
  assert.equal(report.staticSix.available, true);
  assert.equal(report.summary.historyComparable, 0);
  assert.equal(report.summary.historicalEvidence, 'insufficient-history');
  for (const plan of report.plans) {
    assert.equal(plan.available, true);
    assert.equal(plan.shards.length, plan.count);
    const files = plan.shards.flatMap((item) => item.files);
    assert.equal(new Set(files).size, paths.length);
    assert.deepEqual([...files].sort(), [...paths].sort());
    assert.ok(plan.shards.every((item) => item.files.length > 0));
  }
  assert.match(formatShadowReport(report), /NOT measured CI wall time/);
});

test('weighted longest-first packing is deterministic under reversed input and equal weights', () => {
  const files = paths.map((path) => ({ path, durationMs: 5000 }));
  assert.deepEqual(allocateByDuration(files, 6), allocateByDuration([...files].reverse(), 6));
  assert.throws(() => allocateByDuration(files, 16), /empty shards/);
  assert.throws(() => allocateByDuration([...files, files[0]], 6), /duplicate/);
});

test('skewed workload does not omit large or tiny tests', () => {
  const input = snapshot();
  input.records[0].durationMs = 500000;
  const plan = makeShadowReport({ current: input, shards: shards(input) }).plans[0];
  assert.equal(plan.shards.flatMap((item) => item.files).length, 15);
  assert.ok(plan.largestTestLoadMs >= 500000);
});

test('history accepts independent clean evidence and models matching runs', () => {
  const input = snapshot();
  const history = [snapshot('80', B), snapshot('81', B)];
  const report = makeShadowReport({ current: input, history, shards: shards(input) });
  assert.equal(report.summary.historyComparable, 2);
  assert.equal(report.summary.historicalEvidence, 'multi-run-model');
  assert.ok(report.comparisons.every((r) => r.model.staticSixCurrentAssignment));
  assert.ok(report.plans.every((plan) => plan.shards.every((s) => s.files.length > 0)));
});

test('new, removed and renamed spec paths invalidate historical replay without dropping present specs', () => {
  const current = snapshot();
  const removed = snapshot('90', B, paths.slice(1));
  const renamed = snapshot('91', B, [paths[0].replace('shadow', 'renamed'), ...paths.slice(1)]);
  const report = makeShadowReport({ current, history: [removed, renamed] });
  assert.equal(report.summary.historyComparable, 0);
  assert.equal(report.summary.historyIgnored, 2);
  assert.equal(report.plans[0].shards.flatMap((s) => s.files).length, paths.length);
});

test('SHA mismatch, current/duplicate IDs, cancelled and non-green histories cannot become evidence', () => {
  const current = snapshot();
  const wrongSha = snapshot('97', B);
  wrongSha.provenance.headSha = A;
  const duplicate = snapshot('101', B);
  const cancelled = snapshot('98', B);
  cancelled.valid = false;
  const nonGreen = snapshot('99', B);
  nonGreen.records[0].unexpected = 1;
  nonGreen.records[0].expected = 1;
  const incomplete = snapshot('100', B);
  incomplete.summary.unobservedBrowserSpecs = 1;
  const report = makeShadowReport({
    current, history: [wrongSha, duplicate, cancelled, nonGreen, incomplete],
  });
  assert.equal(report.summary.historyAccepted, 0);
  assert.equal(report.summary.historyIgnored, 5);
  assert.equal(report.summary.historicalEvidence, 'insufficient-history');
});

test('mismatched current shard provenance cannot masquerade as measured static-six evidence', () => {
  const current = snapshot();
  const broken = shards(current);
  broken[0].provenance.sourceSha = B;
  const report = makeShadowReport({ current, shards: broken });
  assert.equal(report.staticSix.available, false);
  assert.equal(report.plans.filter((p) => p.available).length, 4);
});

test('zero-duration/unmeasured new spec receives conservative fallback while preserving skip identity', () => {
  const current = snapshot();
  current.records[0].skipped = 2;
  current.records[0].expected = 0;
  current.records[0].durationMs = 0;
  const report = makeShadowReport({ current });
  const found = report.plans[0].shards.find((item) => item.files.includes(paths[0]));
  assert.ok(found);
  assert.ok(report.summary.unknownDefaultMs >= 60000);
  assert.throws(() => validateCleanSnapshot({ ...current, valid: false }), /incomplete/);
});

test('missing, duplicate, wrong type or failed current contracts reject, never silently omit', () => {
  const input = snapshot();
  input.records.push({ ...input.records[0] });
  input.summary.observedBrowserSpecs++;
  input.summary.inventoryBrowserSpecs++;
  assert.throws(() => makeShadowReport({ current: input }), /duplicate/);
  const failed = snapshot();
  failed.records[0].unexpected = 1;
  failed.records[0].expected = 1;
  assert.throws(() => makeShadowReport({ current: failed }), /non-green/);
  const bad = snapshot();
  bad.records[0].path = 'unrelated.spec.ts';
  assert.throws(() => makeShadowReport({ current: bad }), /incomplete/);
  const empty = snapshot();
  empty.records = [];
  empty.summary.inventoryBrowserSpecs = 0;
  empty.summary.observedBrowserSpecs = 0;
  assert.throws(() => makeShadowReport({ current: empty }), /Incomplete/);
});
