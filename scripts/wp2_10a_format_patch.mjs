import { readFile, writeFile } from 'node:fs/promises';

async function replaceInFile(path, replacements) {
  let content = await readFile(path, 'utf8');
  for (const [before, after] of replacements) {
    if (!content.includes(before)) {
      throw new Error(`Formatting patch could not find expected text in ${path}`);
    }
    content = content.replace(before, after);
  }
  await writeFile(path, content);
}

await replaceInFile('src/game/player/UnicornAppearanceRenderer.ts', [
  [
    '    points.push(new Phaser.Geom.Point(x + Math.cos(angle) * pointRadius, y + Math.sin(angle) * pointRadius));',
    '    points.push(\n      new Phaser.Geom.Point(x + Math.cos(angle) * pointRadius, y + Math.sin(angle) * pointRadius),\n    );',
  ],
]);

await replaceInFile('src/game/scenes/MoonflowerGladeScene.ts', [
  [
    '      this.add.ellipse(1110 + offsetX * 0.72, 1045 + offsetY * 0.72, 42, 56, 0xdca7ff, 0.96).setDepth(32);',
    '      this.add\n        .ellipse(1110 + offsetX * 0.72, 1045 + offsetY * 0.72, 42, 56, 0xdca7ff, 0.96)\n        .setDepth(32);',
  ],
  [
    `    this.add\n      .text(\n        28,\n        72,\n        'Move: WASD / arrows  •  Interact: E / Enter / Space  •  Esc: title',\n        {\n          color: '#5a4869',\n          fontFamily: 'system-ui, sans-serif',\n          fontSize: '15px',\n          backgroundColor: '#fff9e8ee',\n          padding: { x: 10, y: 6 },\n        },\n      )`,
    `    this.add\n      .text(28, 72, 'Move: WASD / arrows  •  Interact: E / Enter / Space  •  Esc: title', {\n        color: '#5a4869',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '15px',\n        backgroundColor: '#fff9e8ee',\n        padding: { x: 10, y: 6 },\n      })`,
  ],
]);

console.log('Applied R2-WP2.10A formatter-requested fixes.');
// Trigger workflow after creation.
