import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMergeFreshness } from './mergeFreshnessPolicy.mjs';

const main = 'a'.repeat(40);
const head = 'b'.repeat(40);
const fresh = {
  targetBranch: 'main', liveMainSha: main, candidateHeadSha: head,
  comparison: {
    status: 'ahead', behind_by: 0,
    base_commit: { sha: main }, merge_base_commit: { sha: main },
  },
};

test('PR on current main with full authoritative head passes freshness', () => {
  assert.equal(evaluateMergeFreshness(fresh).passed, true);
});

test('old passing PR head with newer main fails despite green CI', () => {
  const moved = 'c'.repeat(40);
  const outcome = evaluateMergeFreshness({
    ...fresh,
    liveMainSha: moved,
    comparison: {
      status: 'diverged', behind_by: 1,
      base_commit: { sha: moved }, merge_base_commit: { sha: main },
    },
  });
  assert.equal(outcome.passed, false);
  assert.match(outcome.failures.join(' '), /latest main/);
});

test('missing compare evidence and wrong PR base fail closed', () => {
  assert.equal(evaluateMergeFreshness({ ...fresh, comparison: null }).passed, false);
  assert.equal(evaluateMergeFreshness({ ...fresh, targetBranch: 'dev' }).passed, false);
  assert.equal(evaluateMergeFreshness({ ...fresh, liveMainSha: null }).passed, false);
  assert.equal(evaluateMergeFreshness({
    ...fresh, comparison: { ...fresh.comparison, behind_by: 1 },
  }).passed, false);
});

test('same source commit on main is a fresh no-op comparison', () => {
  const result = evaluateMergeFreshness({
    ...fresh, candidateHeadSha: main,
    comparison: { status: 'identical', behind_by: 0, base_commit: { sha: main }, merge_base_commit: { sha: main } },
  });
  assert.equal(result.passed, true);
});
