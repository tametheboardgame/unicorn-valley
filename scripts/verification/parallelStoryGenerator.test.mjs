import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const generator = fileURLToPath(new URL('../generateStoryCatalogue.mjs', import.meta.url));

function addStory(root, id, title) {
  const dir = path.join(root, 'public', 'stories', id);
  mkdirSync(path.join(dir, 'chapters'), { recursive: true });
  writeFileSync(path.join(dir, 'chapters', 'one.md'), '<!-- block:opening -->\nA short page.\n');
  writeFileSync(
    path.join(dir, 'book.json'),
    JSON.stringify({
      schemaVersion: 1,
      id,
      title,
      description: 'Independent title introduced on a parallel Story House branch.',
      author: 'Integration test',
      tags: [],
      discovery: { format: 'storybook', genres: [], audiences: [], length: 'short' },
      publication: { status: 'published' },
      rights: { text: { status: 'original', source: 'ENG-WP2.5 integration fixture' } },
      chapters: [{ id: 'one', title: 'Opening', path: 'chapters/one.md' }],
    }),
  );
}

function generate(order) {
  const root = mkdtempSync(path.join(tmpdir(), 'unicorn-parallel-stories-'));
  try {
    addStory(root, 'middle', 'Middle Story');
    for (const title of order) addStory(root, title.id, title.title);
    execFileSync(process.execPath, [generator], { cwd: root });
    const catalogue = readFileSync(path.join(root, 'public', 'stories', 'catalogue.json'), 'utf8');
    execFileSync(process.execPath, [generator, '--check'], { cwd: root });
    return catalogue;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('real Story House catalogue generator preserves both branches in either integration order', () => {
  const alice = { id: 'alice-new', title: 'Alice New Edition' };
  const lion = { id: 'lion-new', title: 'The Lion Revisited' };
  const forward = generate([alice, lion]);
  const reverse = generate([lion, alice]);
  assert.equal(forward, reverse);
  const catalogue = JSON.parse(forward);
  assert.deepEqual(
    catalogue.stories.map((story) => story.id),
    ['alice-new', 'middle', 'lion-new'],
  );
  assert.equal(new Set(catalogue.stories.map((story) => story.id)).size, 3);
});
