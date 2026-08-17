import { readFile, writeFile } from 'node:fs/promises';

async function replaceInFile(path, replacements) {
  let content = await readFile(path, 'utf8');
  for (const [before, after] of replacements) {
    if (!content.includes(before)) {
      throw new Error(`WP2.10A patch could not find expected text in ${path}: ${before.slice(0, 80)}`);
    }
    content = content.replace(before, after);
  }
  await writeFile(path, content);
}

await replaceInFile('src/game/player/UnicornAppearanceRenderer.ts', [
  ["import type Phaser from 'phaser';", "import Phaser from 'phaser';"],
]);

await replaceInFile('src/game/ui/ActivitySuggestionCard.ts', [
  ['const CARD_Y = 245;', 'const CARD_Y = 270;'],
]);

console.log('Applied R2-WP2.10A follow-up visual patch.');
