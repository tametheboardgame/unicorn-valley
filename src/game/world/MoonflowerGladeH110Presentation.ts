import Phaser from 'phaser';
import { MOONFLOWER_GLADE_MAP, type GladeGardenPlot } from './MoonflowerGladeMap';
import { worldDepthForY } from './WorldDepth';

const ROOT_NAME = 'h1.10:moonflower-glade-final-polish';
const GARDEN_PATH_NAME = 'h1.10:garden-path';
const CORRECTED_BLUE_FLOWER_NAME = 'h1.10:corrected-right-blue-moonflower';

function retireLegacySignLabels(scene: Phaser.Scene): void {
  for (const child of [...scene.children.list]) {
    if (!(child instanceof Phaser.GameObjects.Text)) {
      continue;
    }
    if (child.text === 'Old Garden Gate' || child.text === 'Sunbeam Village → Rainbow Meadow') {
      child.destroy();
    }
  }
}

function createOldGardenGateSign(scene: Phaser.Scene): void {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const post = scene.add.rectangle(0, -42, 24, 84, 0x775039, 1);
  const foot = scene.add.ellipse(0, 2, 42, 14, 0x5e7f55, 0.28);
  const board = scene.add
    .rectangle(0, -112, 202, 68, 0x9a6b47, 1)
    .setStrokeStyle(5, 0x68442f, 1)
    .setAngle(-2);
  const innerBoard = scene.add
    .rectangle(0, -112, 184, 50, 0xb88256, 0.7)
    .setAngle(-2);
  const nailLeft = scene.add.circle(-82, -112, 4, 0x5c5360, 0.88);
  const nailRight = scene.add.circle(82, -112, 4, 0x5c5360, 0.88);
  const label = scene.add
    .text(0, -113, 'Old Garden Gate', {
      color: '#fff2cf',
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAngle(-2);
  const leaf = scene.add.ellipse(-89, -82, 18, 9, 0x79a56b, 0.95).setAngle(-32);
  parts.push(foot, post, board, innerBoard, nailLeft, nailRight, leaf, label);

  scene.add
    .container(300, 832, parts)
    .setName('h1.10:old-garden-gate-sign')
    .setDepth(worldDepthForY(832, 0.42));
}

function createSunbeamDirectionSign(scene: Phaser.Scene): void {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const foot = scene.add.ellipse(0, 2, 44, 14, 0x5f8a61, 0.24);
  const post = scene.add.rectangle(0, -42, 24, 84, 0x8b6445, 1);
  const board = scene.add.graphics();
  board.fillStyle(0xe5c583, 1);
  board.lineStyle(5, 0x8e6844, 1);
  board.fillRoundedRect(-125, -140, 210, 62, 13);
  board.strokeRoundedRect(-125, -140, 210, 62, 13);
  board.fillTriangle(82, -140, 132, -109, 82, -78);
  board.strokeTriangle(82, -140, 132, -109, 82, -78);
  board.fillStyle(0xf4dfa5, 0.42);
  board.fillRoundedRect(-113, -130, 178, 15, 7);
  const sun = scene.add.circle(-99, -109, 13, 0xffdb68, 0.98);
  const label = scene.add
    .text(-4, -109, 'Sunbeam Village', {
      color: '#60452f',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  parts.push(foot, post, board, sun, label);

  scene.add
    .container(2560, 832, parts)
    .setName('h1.10:sunbeam-direction-sign')
    .setDepth(worldDepthForY(832, 0.42));
}

function createGardenPath(scene: Phaser.Scene): void {
  const path = scene.add.graphics().setName(GARDEN_PATH_NAME).setDepth(2.34);
  path.fillStyle(0xe6d1a2, 0.84);
  path.fillRoundedRect(735, 452, 340, 56, 24);
  path.fillStyle(0xf2dfb5, 0.42);
  path.fillRoundedRect(754, 463, 302, 15, 8);
}

function createGardenPlot(scene: Phaser.Scene, plot: GladeGardenPlot, variant: number): void {
  const x = plot.position.x;
  const y = plot.position.y;
  const root = scene.add
    .container(x, y)
    .setName(`h1.10:${plot.id}`)
    .setDepth(worldDepthForY(y + plot.height / 2, -0.38));

  const soil = scene.add
    .rectangle(0, 0, plot.width, plot.height, variant % 2 === 0 ? 0x9b7453 : 0x936d4f, 0.82)
    .setStrokeStyle(8, 0xd5b57b, 0.98);
  const inner = scene.add.rectangle(0, 0, plot.width - 24, plot.height - 24, 0x79583f, 0.18);
  root.add([soil, inner]);

  if (plot.orientation === 'horizontal') {
    const rowSpan = plot.width - 48;
    for (const [index, rowY] of [-55, 0, 55].entries()) {
      const furrow = scene.add.rectangle(0, rowY, rowSpan, 17, 0x684b38, 0.58);
      root.add(furrow);
      for (const offset of [-0.36, -0.12, 0.12, 0.36]) {
        const sprout = scene.add.circle(offset * rowSpan, rowY - 4, 8, 0x6fa468, 0.94);
        const leaf = scene.add.ellipse(offset * rowSpan + 7, rowY - 10, 15, 7, 0x83b978, 0.92);
        leaf.setAngle(index % 2 === 0 ? -24 : 24);
        root.add([sprout, leaf]);
      }
    }
  } else {
    const rowSpan = plot.height - 54;
    for (const [index, rowX] of [-43, 0, 43].entries()) {
      const furrow = scene.add.rectangle(rowX, 0, 17, rowSpan, 0x684b38, 0.58);
      root.add(furrow);
      for (const offset of [-0.34, -0.1, 0.14, 0.36]) {
        const sprout = scene.add.circle(rowX, offset * rowSpan, 8, 0x6fa468, 0.94);
        const leaf = scene.add.ellipse(rowX + (index % 2 === 0 ? 7 : -7), offset * rowSpan - 7, 15, 7, 0x83b978, 0.92);
        leaf.setAngle(index % 2 === 0 ? -28 : 28);
        root.add([sprout, leaf]);
      }
    }
  }
}

function retireFlowerPrimitives(
  scene: Phaser.Scene,
  bounds: { left: number; right: number; top: number; bottom: number },
): void {
  for (const child of [...scene.children.list]) {
    if (
      !(child instanceof Phaser.GameObjects.Arc) &&
      !(child instanceof Phaser.GameObjects.Ellipse) &&
      !(child instanceof Phaser.GameObjects.Rectangle)
    ) {
      continue;
    }
    if (
      child.x >= bounds.left &&
      child.x <= bounds.right &&
      child.y >= bounds.top &&
      child.y <= bounds.bottom
    ) {
      child.destroy();
    }
  }
}

function createCorrectedRightBlueFlower(scene: Phaser.Scene): void {
  const x = 2520;
  const y = 1245;
  const scale = 1;
  const baseDepth = worldDepthForY(y + 52 * scale, 0.08);

  const groundParts: Phaser.GameObjects.GameObject[] = [
    scene.add.ellipse(0, 51, 54, 14, 0x4d8358, 0.16),
    scene.add.rectangle(0, 25, 7, 58, 0x5f9b67, 0.95),
    scene.add.ellipse(-10, 31, 20, 9, 0x72a970, 0.84).setAngle(-28),
    scene.add.ellipse(10, 38, 18, 8, 0x6ca56d, 0.8).setAngle(28),
  ];
  scene.add
    .container(x, y, groundParts)
    .setName(`${CORRECTED_BLUE_FLOWER_NAME}:stem`)
    .setDepth(baseDepth - 0.2);

  const blossom = scene.add.graphics();
  blossom.fillStyle(0xb9d9ff, 0.96);
  for (const [offsetX, offsetY] of [
    [0, -18],
    [18, -5],
    [12, 14],
    [-12, 14],
    [-18, -5],
  ] as const) {
    blossom.fillEllipse(offsetX, offsetY, 28, 38);
  }
  // Draw the centre last inside one graphics object so no petal can ever sort over it.
  blossom.fillStyle(0xffdca1, 1);
  blossom.fillCircle(0, 0, 12);
  scene.add
    .container(x, y, [blossom])
    .setName(CORRECTED_BLUE_FLOWER_NAME)
    .setDepth(baseDepth + 0.16);
}

function correctMoonflowerFieldEdge(scene: Phaser.Scene): void {
  // Remove only the primitive pieces belonging to the two exact review flowers. Special Willow
  // collectables are containers and are deliberately untouched by this pass.
  retireFlowerPrimitives(scene, { left: 2480, right: 2560, top: 1215, bottom: 1305 });
  createCorrectedRightBlueFlower(scene);
  retireFlowerPrimitives(scene, { left: 2490, right: 2565, top: 1425, bottom: 1510 });
}

export function ensureMoonflowerGladeH110Presentation(scene: Phaser.Scene): void {
  if (scene.scene.key !== 'MoonflowerGladeScene' || scene.children.getByName(ROOT_NAME)) {
    return;
  }

  scene.add.container(0, 0).setName(ROOT_NAME).setVisible(false);
  retireLegacySignLabels(scene);
  createOldGardenGateSign(scene);
  createSunbeamDirectionSign(scene);
  createGardenPath(scene);
  MOONFLOWER_GLADE_MAP.gardenPlots
    .filter((plot) => plot.id !== 'garden:main')
    .forEach((plot, index) => createGardenPlot(scene, plot, index));
  correctMoonflowerFieldEdge(scene);
}
