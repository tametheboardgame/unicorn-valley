import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/game/player/UnicornAppearanceRenderer.ts';
let content = await readFile(path, 'utf8');
const before = `function drawStar(\n  graphics: Phaser.GameObjects.Graphics,\n  x: number,\n  y: number,\n  radius: number,\n): void {\n  const points: Phaser.Geom.Point[] = [];\n  for (let index = 0; index < 10; index += 1) {\n    const angle = -Math.PI / 2 + (Math.PI * index) / 5;\n    const pointRadius = index % 2 === 0 ? radius : radius * 0.45;\n    points.push(\n      new Phaser.Geom.Point(x + Math.cos(angle) * pointRadius, y + Math.sin(angle) * pointRadius),\n    );\n  }\n  graphics.fillPoints(points, true);\n}`;
const after = `function drawStar(\n  graphics: Phaser.GameObjects.Graphics,\n  x: number,\n  y: number,\n  radius: number,\n): void {\n  const inner = radius * 0.34;\n  graphics.fillTriangle(x, y - radius, x - inner, y, x + inner, y);\n  graphics.fillTriangle(x, y + radius, x - inner, y, x + inner, y);\n  graphics.fillTriangle(x - radius, y, x, y - inner, x, y + inner);\n  graphics.fillTriangle(x + radius, y, x, y - inner, x, y + inner);\n}`;
if (!content.includes(before)) {
  throw new Error('Could not find drawStar block');
}
content = content.replace(before, after);
await writeFile(path, content);
console.log('Replaced unsupported Phaser.Geom.Point star renderer.');
