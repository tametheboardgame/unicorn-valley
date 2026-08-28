import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from './WorldDepth';

const ANCHOR_NAME = 'r6-region-gateway-art-anchor';
const DETAIL_PREFIX = 'r6-region-gateway-art';

interface Point {
  x: number;
  y: number;
}

function name<T extends Phaser.GameObjects.GameObject>(object: T, id: string): T {
  object.setName(`${DETAIL_PREFIX}:${id}`);
  return object;
}

function drawRoundedPath(
  scene: Phaser.Scene,
  id: string,
  points: readonly Point[],
  outerWidth: number,
  innerWidth: number,
  outerColour = 0xb89b70,
  innerColour = 0xe9d6a8,
): void {
  const graphics = name(scene.add.graphics().setDepth(16.25), `${id}:path`);
  const draw = (width: number, colour: number, alpha: number) => {
    graphics.lineStyle(width, colour, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
    graphics.fillStyle(colour, alpha);
    for (const point of points) {
      graphics.fillCircle(point.x, point.y, width / 2);
    }
  };
  draw(outerWidth, outerColour, 0.94);
  draw(innerWidth, innerColour, 0.98);
}

function addRock(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  colour = 0x6f7d82,
): Phaser.GameObjects.Ellipse {
  return scene.add
    .ellipse(x, y, width, height, colour, 1)
    .setStrokeStyle(4, 0x526168, 0.9)
    .setDepth(depth);
}

function addCrystal(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  depth: number,
  colour = 0x8ce4eb,
): Phaser.GameObjects.Triangle {
  const crystal = scene.add
    .triangle(x, y, 0, 44 * scale, 17 * scale, 0, 34 * scale, 44 * scale, colour, 0.88)
    .setStrokeStyle(3, 0xe3ffff, 0.82)
    .setDepth(depth);
  scene.tweens.add({
    targets: crystal,
    alpha: { from: 0.62, to: 1 },
    duration: 980 + Math.round(x % 260),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
  return crystal;
}

function createCaveMouth(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  label: string,
  crystalColour = 0x86dce5,
): void {
  const objects: Phaser.GameObjects.GameObject[] = [];
  objects.push(
    scene.add.ellipse(0, 54, 260, 90, 0x35494e, 0.3),
    scene.add.ellipse(0, -4, 220, 230, 0x59686c, 1).setStrokeStyle(7, 0x45565b, 0.96),
    scene.add.ellipse(0, 18, 130, 162, 0x263a43, 1).setStrokeStyle(5, 0x9ac8c9, 0.48),
    scene.add.ellipse(0, 62, 118, 34, 0x152c35, 0.9),
  );
  for (const [dx, dy, width, height] of [
    [-104, 58, 100, 86],
    [-92, -44, 90, 100],
    [-42, -108, 102, 80],
    [38, -112, 106, 82],
    [96, -54, 90, 108],
    [110, 55, 96, 82],
  ] as const) {
    objects.push(
      scene.add.ellipse(dx, dy, width, height, 0x738184, 1).setStrokeStyle(4, 0x536268, 0.88),
    );
  }
  objects.push(
    scene.add.text(-104, -88, '✦', {
      color: '#cfffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
    }),
    scene.add.text(86, -94, '✦', {
      color: '#dffaff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    }),
    scene.add
      .text(0, 134, label, {
        color: '#eaffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#314b54ee',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5),
  );
  for (const [dx, dy, scale] of [
    [-125, 14, 0.8],
    [-72, -118, 0.62],
    [122, 20, 0.72],
  ] as const) {
    const crystal = scene.add
      .triangle(dx, dy, 0, 38 * scale, 14 * scale, 0, 28 * scale, 38 * scale, crystalColour, 0.9)
      .setStrokeStyle(2, 0xe8ffff, 0.8);
    objects.push(crystal);
  }
  name(
    scene.add.container(x, y, objects).setDepth(worldDepthForY(y, 0.76)),
    `${id}:cave-mouth`,
  );
}

function createWoodlandThreshold(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  label: string,
): void {
  const objects: Phaser.GameObjects.GameObject[] = [];
  for (const side of [-1, 1]) {
    const trunkX = side * 76;
    objects.push(
      scene.add
        .rectangle(trunkX, 6, 54, 224, 0x5a4b3d, 1)
        .setStrokeStyle(4, 0x40382f, 0.88)
        .setAngle(side * 5),
      scene.add.ellipse(trunkX + side * 18, -96, 166, 118, 0x315d49, 1),
      scene.add.ellipse(trunkX - side * 30, -58, 142, 106, 0x3d7155, 0.96),
      scene.add.ellipse(trunkX + side * 44, -38, 112, 88, 0x4b815e, 0.92),
    );
  }
  objects.push(
    scene.add.ellipse(0, 44, 126, 116, 0x17392f, 0.66),
    scene.add.ellipse(0, 76, 154, 36, 0x9bc985, 0.18),
    scene.add
      .text(0, 134, label, {
        color: '#eaffdf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#294838ee',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5),
  );
  for (const [dx, dy] of [
    [-118, 54],
    [-94, 82],
    [98, 66],
    [126, 40],
  ] as const) {
    objects.push(
      scene.add.ellipse(dx, dy, 38, 22, 0xb7d8f0, 0.82),
      scene.add.rectangle(dx, dy + 18, 6, 30, 0x536d56, 0.78),
    );
  }
  name(
    scene.add.container(x, y, objects).setDepth(worldDepthForY(y, 0.78)),
    `${id}:woodland-threshold`,
  );
}

function createCascadeRaceGate(scene: Phaser.Scene, x: number, y: number): void {
  const objects: Phaser.GameObjects.GameObject[] = [];
  objects.push(
    scene.add.ellipse(0, 62, 250, 60, 0x65d5dc, 0.2),
    scene.add.rectangle(-82, 0, 32, 210, 0x4d8d99, 1).setStrokeStyle(4, 0xbef3f3, 0.75),
    scene.add.rectangle(82, 0, 32, 210, 0x4d8d99, 1).setStrokeStyle(4, 0xbef3f3, 0.75),
    scene.add
      .rectangle(0, -88, 198, 48, 0xcaf6f3, 1)
      .setStrokeStyle(5, 0x7189c3, 0.9),
    scene.add
      .text(0, -88, '💎  CRYSTAL CASCADE  🏁', {
        color: '#365965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
    scene.add.ellipse(0, 26, 128, 138, 0x3a7684, 0.32),
  );
  for (const [dx, dy, scale] of [
    [-116, -8, 1],
    [-122, 54, 0.7],
    [116, -2, 0.9],
    [126, 58, 0.68],
  ] as const) {
    objects.push(
      scene.add
        .triangle(dx, dy, 0, 48 * scale, 18 * scale, 0, 36 * scale, 48 * scale, 0xa1e9ef, 0.92)
        .setStrokeStyle(3, 0xe8ffff, 0.8),
    );
  }
  name(
    scene.add.container(x, y, objects).setDepth(worldDepthForY(y, 0.8)),
    'crystal-cascade:race-gate',
  );
}

function decorateMeadow(scene: Phaser.Scene): void {
  drawRoundedPath(
    scene,
    'meadow-crystal-brook',
    [
      { x: 2240, y: 1090 },
      { x: 2390, y: 1320 },
      { x: 2580, y: 1510 },
      { x: 2800, y: 1660 },
      { x: 3030, y: 1750 },
    ],
    112,
    84,
    0xa98d68,
    0xe6cfa1,
  );
  createCaveMouth(scene, 'meadow-crystal-brook', 3030, 1750, 'Crystal Brook', 0x89dce6);

  const divider = name(scene.add.container(0, 0).setDepth(15.8), 'meadow-crystal-brook:divider');
  for (const [x, y, scale] of [
    [2380, 1640, 1],
    [2510, 1710, 0.85],
    [2670, 1770, 0.92],
  ] as const) {
    divider.add([
      scene.add.ellipse(x, y, 108 * scale, 76 * scale, 0x5c9c68, 0.94),
      scene.add.ellipse(x + 38 * scale, y - 26 * scale, 82 * scale, 64 * scale, 0x79b66f, 0.9),
    ]);
  }
}

function decorateBrook(scene: Phaser.Scene): void {
  drawRoundedPath(
    scene,
    'brook-woods',
    [
      { x: 2580, y: 1200 },
      { x: 2810, y: 1110 },
      { x: 3050, y: 1030 },
      { x: 3260, y: 990 },
    ],
    88,
    64,
    0x8c8069,
    0xcdbf96,
  );
  createWoodlandThreshold(scene, 'brook-woods', 3260, 990, 'Whispering Woods');

  drawRoundedPath(
    scene,
    'crystal-cascade',
    [
      { x: 2520, y: 1170 },
      { x: 2620, y: 1050 },
      { x: 2740, y: 940 },
      { x: 2860, y: 850 },
    ],
    86,
    60,
    0x8aa0a2,
    0xc6e4df,
  );
  createCascadeRaceGate(scene, 2860, 850);
  createCaveMouth(scene, 'brook-meadow', 120, 1090, 'Rainbow Meadow', 0xf1c7e6);

  const cliffs = name(scene.add.container(0, 0).setDepth(7.45), 'crystal-brook:production-upgrade');
  for (const [x, y, width, height] of [
    [520, 410, 360, 190],
    [880, 350, 300, 170],
    [2350, 310, 340, 190],
    [3190, 520, 360, 220],
  ] as const) {
    cliffs.add(addRock(scene, x, y, width, height, 7.45, 0x748985));
    cliffs.add(addRock(scene, x, y - height * 0.16, width * 0.76, height * 0.52, 7.46, 0x8aa09a));
  }
  for (const [x, y, scale] of [
    [430, 470, 1.1],
    [720, 455, 0.8],
    [2260, 420, 1],
    [2460, 410, 0.78],
    [3150, 650, 1.05],
  ] as const) {
    cliffs.add(addCrystal(scene, x, y, scale, 7.6));
  }

  const cascade = name(scene.add.container(0, 0).setDepth(6.2), 'crystal-brook:cascade-upgrade');
  cascade.add([
    scene.add.ellipse(3150, 560, 310, 170, 0x637c7c, 0.9),
    scene.add.rectangle(3150, 650, 150, 260, 0x5bc4d4, 0.82),
    scene.add.rectangle(3150, 650, 62, 260, 0xb9f2ee, 0.48),
    scene.add.ellipse(3150, 790, 320, 104, 0x85e0e1, 0.64),
    scene.add.ellipse(3150, 786, 240, 46, 0xe6ffff, 0.46),
  ]);
}

function decorateWoods(scene: Phaser.Scene): void {
  createWoodlandThreshold(scene, 'woods-brook', 120, 1090, 'Crystal Brook');
  drawRoundedPath(
    scene,
    'woods-entry-trail',
    [
      { x: 120, y: 1090 },
      { x: 420, y: 1090 },
      { x: 690, y: 1020 },
      { x: 930, y: 920 },
    ],
    84,
    58,
    0x5b5848,
    0x91866a,
  );

  const forest = name(scene.add.container(0, 0).setDepth(6.15), 'whispering-woods:production-upgrade');
  for (const [x, y, scale] of [
    [390, 430, 1.15],
    [930, 350, 1.05],
    [1770, 380, 1.25],
    [2300, 390, 1.08],
    [3020, 420, 1.22],
    [520, 1830, 1.18],
    [1290, 1810, 1.04],
    [2780, 1830, 1.16],
  ] as const) {
    forest.add([
      scene.add.rectangle(x, y, 48 * scale, 240 * scale, 0x473d34, 1),
      scene.add.ellipse(x - 58 * scale, y - 112 * scale, 190 * scale, 128 * scale, 0x214a3c, 0.96),
      scene.add.ellipse(x + 50 * scale, y - 130 * scale, 210 * scale, 142 * scale, 0x2c5d47, 0.96),
      scene.add.ellipse(x + 5 * scale, y - 182 * scale, 180 * scale, 126 * scale, 0x386c50, 0.9),
    ]);
  }
  for (const [x, y, colour] of [
    [850, 1340, 0xc5ddf4],
    [940, 1390, 0xd8c6f1],
    [1080, 1360, 0xb9edc5],
    [2070, 1540, 0xc5ddf4],
    [2160, 1600, 0xd8c6f1],
    [2880, 1440, 0xb9edc5],
  ] as const) {
    forest.add([
      scene.add.rectangle(x, y + 18, 7, 42, 0x526b55, 0.82),
      scene.add.ellipse(x, y - 10, 58, 30, colour, 0.86),
      scene.add.circle(x, y - 8, 48, colour, 0.08),
    ]);
  }

  const light = name(scene.add.graphics().setDepth(5.7), 'whispering-woods:light-shafts');
  light.fillStyle(0xd9efc7, 0.075);
  light.fillTriangle(710, 0, 940, 0, 1250, 1180);
  light.fillTriangle(2150, 0, 2370, 0, 2030, 1140);
}

function decorateScene(scene: Phaser.Scene): void {
  if (scene.scene.key === 'RainbowMeadowScene') {
    decorateMeadow(scene);
  } else if (scene.scene.key === 'CrystalBrookScene') {
    decorateBrook(scene);
  } else if (scene.scene.key === 'WhisperingWoodsScene') {
    decorateWoods(scene);
  }
}

export class R6RegionGatewayArtManager {
  private readonly refresh = new RefreshThrottle(120);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.refresh.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      if (
        scene.scene.key !== 'RainbowMeadowScene' &&
        scene.scene.key !== 'CrystalBrookScene' &&
        scene.scene.key !== 'WhisperingWoodsScene'
      ) {
        continue;
      }
      if (scene.children.getByName(ANCHOR_NAME)) {
        continue;
      }
      scene.add.zone(-64, -64, 2, 2).setName(ANCHOR_NAME).setVisible(false);
      decorateScene(scene);
    }
  }
}

let manager: R6RegionGatewayArtManager | null = null;

export function getR6RegionGatewayArtManager(game: Phaser.Game): R6RegionGatewayArtManager {
  manager ??= new R6RegionGatewayArtManager(game);
  return manager;
}
