import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMergeGate } from './mergeGatePolicy.mjs';

const full = {
  planResult: 'success',
  changeClass: 'full-qualification',
  plannedHead: 'head-1',
  currentHead: 'head-1',
  requireAuthoritative: true,
  required: {
    tier0: true,
    tier1: true,
    build: true,
    tier2: false,
    smoke: true,
    tier3: true,
    tier4: true,
  },
  outcomes: {
    tier0: 'success',
    tier1: 'success',
    build: 'success',
    tier2: 'skipped',
    smoke: 'success',
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

test('authoritative qualification cannot omit production build', () => {
  const result = evaluateMergeGate({
    ...full,
    required: { ...full.required, build: false },
    outcomes: { ...full.outcomes, build: 'skipped' },
  });
  assert.equal(result.passed, false);
  assert.match(result.failures.join(' '), /Authoritative qualification must include/);
});

test('ready-for-review refuses selective PR verification even if selected jobs are green', () => {
  const result = evaluateMergeGate({
    ...full,
    changeClass: 'bounded-feature',
    required: {
      ...full.required,
      tier1: false,
      tier2: true,
      smoke: false,
      tier3: false,
      tier4: false,
    },
    outcomes: {
      ...full.outcomes,
      tier1: 'skipped',
      tier2: 'success',
      smoke: 'skipped',
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
    required: {
      ...full.required,
      tier1: false,
      tier2: true,
      smoke: false,
      tier3: false,
      tier4: false,
    },
    outcomes: {
      ...full.outcomes,
      tier1: 'skipped',
      tier2: 'success',
      smoke: 'skipped',
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

test('variable-count qualification requires independent reconciliation as an additional gate', () => {
  const withTrial = {
    ...full,
    required: { ...full.required, evidence: true },
    outcomes: { ...full.outcomes, evidence: 'success' },
  };
  assert.equal(evaluateMergeGate(withTrial).passed, true);
  for (const outcome of ['failure', 'cancelled', 'skipped', 'missing']) {
    const result = evaluateMergeGate({
      ...withTrial,
      outcomes: { ...withTrial.outcomes, evidence: outcome },
    });
    assert.equal(result.passed, false);
    assert.match(result.failures.join(' '), /evidence: required check/);
  }
});
