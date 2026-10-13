import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateFinalOverlap,
  inspectConcurrentPrs,
  projectIntegratedStoryCatalogue,
} from './parallelIntegrationPolicy.mjs';

const head = 'a'.repeat(40);
const prs = [
  { number: 400, branch: 'agent/world-example', headSha: head,
    files: ['src/world/new-place.ts', 'docs/streams/state/world.json'],
    preview: { branchUrl: 'https://agent-world-example.unicorn-valley.pages.dev', deployedPrefix: head.slice(0, 7), status: 'success' } },
  { number: 401, branch: 'agent/mg-example', headSha: 'b'.repeat(40),
    files: ['src/game/minigames/game.ts', 'docs/streams/state/just-games.json'],
    preview: { branchUrl: 'https://agent-mg-example.unicorn-valley.pages.dev', deployedPrefix: 'bbbbbbb', status: 'success' } },
  { number: 402, branch: 'agent/story-house-example', headSha: 'c'.repeat(40),
    files: ['public/stories/new-book/book.json', 'docs/streams/state/story-house.json'],
    preview: { branchUrl: 'https://agent-story-house-example.unicorn-valley.pages.dev', deployedPrefix: 'ccccccc', status: 'success' } },
];

test('three parallel World/Games/Story branches have independent status and previews', () => {
  const outcome = inspectConcurrentPrs(prs);
  assert.deepEqual(outcome.errors, []);
  assert.deepEqual(outcome.overlaps, []);
  assert.equal(outcome.previews.length, 3);
  assert.ok(outcome.previews.every((preview) => preview.reportedSuccessful));
});

test('shared preview URLs and unbound or unsuccessful deployments are not accepted', () => {
  const bad = inspectConcurrentPrs([
    prs[0],
    { ...prs[1], preview: { ...prs[0].preview, deployedPrefix: 'badcode' } },
  ]);
  assert.match(bad.errors.join(' '), /share one branch preview/);
  assert.equal(bad.previews[1].reportedSuccessful, false);
  assert.equal(inspectConcurrentPrs([{ ...prs[0], preview: { ...prs[0].preview, status: 'failed' } }]).previews[0].reportedSuccessful, false);
});

test('overlapping BrowserDiagnostics contracts and shared catalogue registration are visible', () => {
  const a = { ...prs[0], files: ['src/game/testing/BrowserDiagnostics.ts', 'src/game/minigames/MiniGameCatalogue.ts'] };
  const b = { ...prs[1], files: ['src/game/testing/BrowserDiagnostics.ts', 'src/game/minigames/MiniGameCatalogue.ts'] };
  const result = inspectConcurrentPrs([a, b]);
  assert.deepEqual(result.overlaps.map((overlap) => overlap.path).sort(), [
    'src/game/minigames/MiniGameCatalogue.ts',
    'src/game/testing/BrowserDiagnostics.ts',
  ]);
  assert.equal(result.overlaps[0].registration, false);
  assert.equal(result.overlaps[1].registration, true);
});

test('new final PR cannot silently merge while another open stream owns changed source', () => {
  const a = { ...prs[1], files: ['src/game/testing/BrowserDiagnostics.ts'] };
  const b = { ...prs[0], files: ['src/game/testing/BrowserDiagnostics.ts'] };
  const result = evaluateFinalOverlap(a, [b]);
  assert.equal(result.passed, false);
  assert.match(result.errors.join(' '), /Unresolved overlap with open PR #400/);
  assert.equal(evaluateFinalOverlap({ ...a, number: 289 }, [b]).passed, true);
  assert.equal(evaluateFinalOverlap(a, [{ ...b, files: ['src/world/unrelated.ts'] }]).passed, true);
});

test('Story House generated index includes every published title regardless of integration order', () => {
  const base = [{ id: 'base', title: 'Middle', publication: 'published' }];
  const alice = [{ id: 'alice', title: 'Alice', publication: 'published' }];
  const lion = [{ id: 'lion', title: 'The Lion', publication: 'published' }];
  const first = projectIntegratedStoryCatalogue(base, [alice, lion]);
  const reversed = projectIntegratedStoryCatalogue(base, [lion, alice]);
  assert.deepEqual(first, reversed);
  assert.deepEqual(first.map((entry) => entry.id), ['alice', 'base', 'lion']);
  assert.equal(projectIntegratedStoryCatalogue(base, [[{ id: 'hidden', title: 'Secret', publication: 'hidden' }]]).length, 1);
  assert.throws(() => projectIntegratedStoryCatalogue(base, [alice, alice]), /Conflicting story ID/);
});
