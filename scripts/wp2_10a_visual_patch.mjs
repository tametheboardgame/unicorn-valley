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

await replaceInFile('src/game/scenes/MoonflowerGladeScene.ts', [
  [".text(28, 28, 'Moonflower Glade', {", ".text(28, 22, 'Moonflower Glade', {"],
  ["fontSize: '26px',\n        fontStyle: 'bold',\n        backgroundColor: '#fff9e8dd',\n        padding: { x: 14, y: 9 },", "fontSize: '24px',\n        fontStyle: 'bold',\n        backgroundColor: '#fff9e8f2',\n        padding: { x: 14, y: 8 },"],
  ["        82,\n        'WASD / arrows to explore  •  E / Enter / Space to interact  •  Escape to title',", "        72,\n        'Move: WASD / arrows  •  Interact: E / Enter / Space  •  Esc: title',"],
  ["fontSize: '17px',\n          backgroundColor: '#fff9e8c8',\n          padding: { x: 11, y: 7 },", "fontSize: '15px',\n          backgroundColor: '#fff9e8ee',\n          padding: { x: 10, y: 6 },"],
  ["        128,\n        this.hasFirstDiscovery", "        112,\n        this.hasFirstDiscovery"],
  ["fontSize: '16px',\n          backgroundColor: '#fff9e8b8',", "fontSize: '14px',\n          backgroundColor: '#fff9e8e8',"],
  ["this.add.rectangle(1110, 1110, 13, 120, 0x5d9b68, 1).setDepth(8);", "this.add.rectangle(1110, 1092, 9, 86, 0x5d9b68, 1).setDepth(8);"],
  ["this.add.ellipse(1110 + offsetX, 1040 + offsetY, 58, 78, 0xdca7ff, 0.96).setDepth(32);", "this.add.ellipse(1110 + offsetX * 0.72, 1045 + offsetY * 0.72, 42, 56, 0xdca7ff, 0.96).setDepth(32);"],
  ["this.add.circle(1110, 1040, 25, 0xffe5a2, 1).setDepth(33);", "this.add.circle(1110, 1045, 18, 0xffe5a2, 1).setDepth(33);"],
]);

await replaceInFile('src/game/scenes/SunbeamVillageScene.ts', [
  [".text(GAME_WIDTH / 2, 34, 'Sunbeam Village', {", ".text(GAME_WIDTH / 2, 24, 'Sunbeam Village', {"],
  ["fontSize: '30px',\n        fontStyle: 'bold',\n        backgroundColor: '#fff7dfdd',", "fontSize: '27px',\n        fontStyle: 'bold',\n        backgroundColor: '#fff7dff2',"],
]);

await replaceInFile('src/game/scenes/CottageInteriorScene.ts', [
  ["fontFamily: 'system-ui, sans-serif',\n        fontSize: '30px',\n        fontStyle: 'bold',", "fontFamily: 'system-ui, sans-serif',\n        fontSize: '27px',\n        fontStyle: 'bold',"],
]);

console.log('Applied R2-WP2.10A visual patch.');
// Triggered after workflow creation.
