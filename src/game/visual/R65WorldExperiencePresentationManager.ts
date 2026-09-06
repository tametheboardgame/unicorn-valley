import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from '../world/WorldDepth';

const ROOT_NAME = 'wp18f-world-experience';

function addCrystalCluster(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  colours: readonly [number, number, number],
): void {
  const depth = worldDepthForY(y, 0.12);
  const glow = scene.add.circle(0, 4, 54 * scale, colours[1], 0.13);
  const base = scene.add.ellipse(0, 22 * scale, 100 * scale, 35 * scale, 0x738c83, 0.72);
  const left = scene.add
    .triangle(-24 * scale, 0, 0, 42, 15, 0, 29, 42, colours[0], 0.96)
    .setStrokeStyle(3 * scale, 0x507685, 0.8);
  const centre = scene.add
    .triangle(0, -18 * scale, 0, 62, 22, 0, 44, 62, colours[1], 1)
    .setStrokeStyle(3 * scale, 0x507685, 0.82);
  const right = scene.add
    .triangle(29 * scale, 4 * scale, 0, 38, 14, 0, 28, 38, colours[2], 0.95)
    .setStrokeStyle(2.5 * scale, 0x507685, 0.76);
  const shine = scene.add
    .rectangle(3 * scale, -3 * scale, 5 * scale, 34 * scale, 0xffffff, 0.42)
    .setAngle(19);
  scene.add
    .container(x, y, [glow, base, left, centre, right, shine])
    .setName(`${ROOT_NAME}:crystal-cluster:${x}:${y}`)
    .setDepth(depth);
}

function enhanceShellCove(scene: Phaser.Scene): void {
  if (scene.children.getByName(`${ROOT_NAME}:shell-cove`)) {
    return;
  }

  const anchor = scene.add.container(820, 790).setName(`${ROOT_NAME}:shell-cove`).setDepth(2.45);
  const outerWater = scene.add
    .ellipse(0, 15, 570, 300, 0x59bfd1, 0.94)
    .setStrokeStyle(13, 0xf8edcf, 0.92);
  const innerWater = scene.add.ellipse(18, 9, 435, 210, 0xa3e5e2, 0.54);
  const foam = scene.add
    .ellipse(-18, 88, 380, 74, 0xfaf2d6, 0.5)
    .setStrokeStyle(5, 0xffffff, 0.36);
  anchor.add([outerWater, innerWater, foam]);

  for (const [x, y, width, height, colour] of [
    [535, 760, 180, 125, 0xa87875],
    [615, 650, 145, 105, 0xbc8580],
    [1035, 675, 175, 120, 0xa97979],
    [1110, 795, 150, 110, 0xbc8980],
  ] as const) {
    scene.add
      .ellipse(x, y, width, height, colour, 0.96)
      .setStrokeStyle(4, 0x80676c, 0.66)
      .setDepth(worldDepthForY(y, 0.08));
  }

  for (const [x, y, rotation] of [
    [660, 810, -18],
    [995, 800, 17],
    [775, 690, 8],
  ] as const) {
    scene.add
      .text(x, y, '🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '30px' })
      .setOrigin(0.5)
      .setAngle(rotation)
      .setDepth(worldDepthForY(y, 0.25));
  }

  createUnicornSandcastle(scene, 1160, 1025);
}

function createUnicornSandcastle(scene: Phaser.Scene, x: number, y: number): void {
  if (scene.children.getByName(`${ROOT_NAME}:unicorn-sandcastle`)) {
    return;
  }

  const sand = 0xdcae68;
  const shadow = 0xb98751;
  const body = scene.add.ellipse(0, 0, 102, 55, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const neck = scene.add.ellipse(38, -27, 38, 70, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const head = scene.add.circle(63, -53, 27, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const horn = scene.add
    .triangle(68, -91, 0, 30, 8, 0, 16, 30, 0xf4d893, 1)
    .setStrokeStyle(2, shadow, 0.7);
  const mane = scene.add.ellipse(31, -42, 22, 62, 0xf0cf8c, 0.96).setAngle(18);
  const tail = scene.add.ellipse(-60, -6, 25, 61, 0xf0cf8c, 0.96).setAngle(-38);
  const eye = scene.add.circle(72, -57, 3, 0x70554b, 0.86);
  const shellCrown = scene.add
    .text(61, -78, '🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '15px' })
    .setOrigin(0.5);
  scene.add
    .container(x, y, [tail, body, neck, mane, head, horn, eye, shellCrown])
    .setName(`${ROOT_NAME}:unicorn-sandcastle`)
    .setDepth(worldDepthForY(y, 0.28));
}

function enhanceCrystalBrook(scene: Phaser.Scene): void {
  if (scene.children.getByName(`${ROOT_NAME}:crystal-brook`)) {
    return;
  }
  scene.add.container(0, 0).setName(`${ROOT_NAME}:crystal-brook`).setVisible(false);

  addCrystalCluster(scene, 820, 810, 0.8, [0x8ad8ec, 0xc7f3ff, 0xbfa9eb]);
  addCrystalCluster(scene, 1690, 790, 0.92, [0x8bcde8, 0xd1f4ff, 0xa99be7]);
  addCrystalCluster(scene, 2510, 760, 0.85, [0x92d6e8, 0xc4f0f4, 0xc19de8]);
  addCrystalCluster(scene, 2980, 1650, 1.02, [0x84c8dc, 0xd4f6ff, 0xc5a2ef]);

  const grottoDepth = worldDepthForY(1940, -0.8);
  scene.add
    .ellipse(3190, 1870, 410, 285, 0x647377, 0.98)
    .setName(`${ROOT_NAME}:prism-grotto-rock`)
    .setStrokeStyle(13, 0x82999a, 0.86)
    .setDepth(grottoDepth);
  scene.add
    .ellipse(3190, 1902, 250, 205, 0x273f4a, 1)
    .setName(`${ROOT_NAME}:prism-grotto-mouth`)
    .setStrokeStyle(8, 0x9ed4d5, 0.62)
    .setDepth(grottoDepth + 0.08);
  for (const [dx, dy, scale] of [
    [-155, -70, 0.72],
    [142, -62, 0.78],
    [-102, -132, 0.62],
    [95, -128, 0.66],
  ] as const) {
    addCrystalCluster(scene, 3190 + dx, 1870 + dy, scale, [0x83cfe3, 0xcaf4fa, 0xc0a4ec]);
  }
  scene.add
    .text(3190, 1770, '✦', {
      color: '#e8ffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAlpha(0.72)
    .setDepth(grottoDepth + 0.3);
}

function addShopPropCard(
  scene: Phaser.Scene,
  name: string,
  x: number,
  y: number,
  icon: string,
  fill: number,
): void {
  const depth = worldDepthForY(y, 0.22);
  const mat = scene.add
    .ellipse(0, 20, 150, 44, fill, 0.28)
    .setStrokeStyle(3, 0xffffff, 0.28);
  const prop = scene.add
    .text(0, -3, icon, { fontFamily: 'system-ui, sans-serif', fontSize: '38px' })
    .setOrigin(0.5);
  scene.add.container(x, y, [mat, prop]).setName(name).setDepth(depth);
}

function enhanceVillageShops(scene: Phaser.Scene): void {
  if (scene.children.getByName(`${ROOT_NAME}:village-shops`)) {
    return;
  }
  scene.add.container(0, 0).setName(`${ROOT_NAME}:village-shops`).setVisible(false);

  addShopPropCard(scene, `${ROOT_NAME}:bakery-basket`, 720, 690, '🥖 🥐', 0xe8aa65);
  addShopPropCard(scene, `${ROOT_NAME}:bakery-menu`, 1080, 690, '🧁', 0xf2c27b);

  addShopPropCard(scene, `${ROOT_NAME}:thread-display`, 1325, 675, '🧵 🎀', 0xd796cc);
  addShopPropCard(scene, `${ROOT_NAME}:mirror-display`, 1675, 675, '🪞', 0xb894d3);

  addShopPropCard(scene, `${ROOT_NAME}:story-cart`, 1910, 705, '📚', 0x7ba9c8);
  addShopPropCard(scene, `${ROOT_NAME}:story-lamp`, 2310, 705, '🏮', 0x9cc9d9);
}

export class R65WorldExperiencePresentationManager {
  private readonly refresh = new RefreshThrottle(250);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!this.refresh.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key === 'StarlightBeachScene') {
        enhanceShellCove(scene);
      } else if (scene.scene.key === 'CrystalBrookScene') {
        enhanceCrystalBrook(scene);
      } else if (scene.scene.key === 'SunbeamVillageScene') {
        enhanceVillageShops(scene);
      }
    }
  }
}

let manager: R65WorldExperiencePresentationManager | null = null;

export function getR65WorldExperiencePresentationManager(
  game: Phaser.Game,
): R65WorldExperiencePresentationManager {
  manager ??= new R65WorldExperiencePresentationManager(game);
  return manager;
}
