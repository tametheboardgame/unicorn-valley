import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMergeGate } from './mergeGatePolicy.mjs';

const full = {
  planResult: 'success',
  changeClass: 'full-qualification',
  plannedHead: 'head-1',
  currentHead: 'head-1',
  requireAuthoritative: true,
  required: { tier0: true, tier1: true, build: true, tier2: false, tier3: true, tier4: true },
  outcomes: {
    tier0: 'success',
    tier1: 'success',
    build: 'success',
    tier2: 'skipped',
    tier3: 'success',
    tier4: 'success',
  },
};

test('exact-head authoritative full CI permits merge only when required jobs passed', () => {
  assert.deepEqual(evaluateMergeGate(full), {
    passed: true,
    authoritative: true,
    failures: [],
  });
});

test('new PR head invalidates any green older qualification', () => {
  const result = evaluateMergeGate({ ...full, currentHead: 'head-2' });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' '), /current exact PR head/);
});

test('full qualification cannot pass with one failed Chromium shard', () => {
  const result = evaluateMergeGate({
    ...full,
    outcomes: { ...full.outcomes, tier3: 'failure' },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' '), /tier3/);
});

test('ready-for-review refuses selective PR verification even if selected jobs are green', () => {
  const result = evaluateMergeGate({
    ...full,
    changeClass: 'bounded-feature',
    required: { ...full.required, tier1: false, tier2: true, tier3: false, tier4: false },
    outcomes: {
      ...full.outcomes,
      tier1: 'skipped',
      tier2: 'success',
      tier3: 'skipped',
      tier4: 'skipped',
    },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' '), /authoritative full qualification/);
});

test('draft PR has meaningful provisional targeted checks without claiming authority', () => {
  const result = evaluateMergeGate({
    ...full,
    changeClass: 'bounded-feature',
    requireAuthoritative: false,
    required: { ...full.required, tier1: false, tier2: true, tier3: false, tier4: false },
    outcomes: {
      ...full.outcomes,
      tier1: 'skipped',
      tier2: 'success',
      tier3: 'skipped',
      tier4: 'skipped',
    },
  });
  assert.equal(result.passed, true);
  assert.equal(result.authoritative, false);
});

test('required skips and plan failure are hard failures', () => {
  const result = evaluateMergeGate({
    ...full,
    planResult: 'failure',
    outcomes: { ...full.outcomes, tier0: 'skipped' },
  });
  assert.equal(result.passed, false);
  assert.equal(result.failures.length, 2);
});
