import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD,
  CRYSTAL_BROOK_MEADOW_THRESHOLD,
  CRYSTAL_BROOK_WOODS_THRESHOLD,
} from './CrystalBrookMap';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
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

function addFacetedRock(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  colour: number,
  variant = 0,
): Phaser.GameObjects.Container {
  const variants = [
    [-0.5, 0.05, -0.38, -0.34, -0.08, -0.5, 0.3, -0.36, 0.5, -0.02, 0.34, 0.38, 0, 0.5, -0.4, 0.34],
    [-0.5, -0.02, -0.28, -0.46, 0.08, -0.5, 0.46, -0.24, 0.5, 0.12, 0.18, 0.48, -0.2, 0.42],
    [
      -0.48, 0.12, -0.44, -0.26, -0.12, -0.5, 0.26, -0.44, 0.5, -0.08, 0.42, 0.34, 0.08, 0.5, -0.34,
      0.4,
    ],
    [
      -0.5, 0.08, -0.34, -0.4, 0.02, -0.5, 0.4, -0.34, 0.5, 0.08, 0.26, 0.46, -0.14, 0.5, -0.46,
      0.28,
    ],
  ] as const;
  const shape = variants[variant % variants.length];
  const points: number[] = [];
  for (let index = 0; index < shape.length; index += 2) {
    points.push(shape[index] * width, shape[index + 1] * height);
  }

  const shadow = scene.add.polygon(7, 9, points, 0x34484a, 0.28);
  const body = scene.add.polygon(0, 0, points, colour, 1).setStrokeStyle(4, 0x465a5c, 0.92);
  const highlight = scene.add
    .polygon(
      -width * 0.08,
      -height * 0.12,
      [
        -width * 0.2,
        0,
        -width * 0.08,
        -height * 0.2,
        width * 0.18,
        -height * 0.16,
        width * 0.08,
        height * 0.02,
      ],
      0xbac7bd,
      0.28,
    )
    .setStrokeStyle(2, 0xd9e1da, 0.12);

  const crack = scene.add.graphics();
  crack.lineStyle(3, 0x3f5556, 0.36);
  crack.beginPath();
  crack.moveTo(-width * 0.06, -height * 0.12);
  crack.lineTo(width * 0.03, height * 0.02);
  crack.lineTo(width * 0.14, height * 0.08);
  crack.strokePath();

  return scene.add.container(x, y, [shadow, body, highlight, crack]).setDepth(depth);
}

function addNaturalRock(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  colour: number,
  kind: string,
  angle = 0,
): Phaser.GameObjects.Container {
  const shapes: Record<string, readonly number[]> = {
    slab: [
      -0.55, 0.08, -0.46, -0.28, -0.16, -0.42, 0.28, -0.36, 0.55, -0.04, 0.42, 0.3, 0.05, 0.42,
      -0.38, 0.32,
    ],
    spire: [-0.3, 0.5, -0.44, 0.08, -0.22, -0.54, 0.08, -0.64, 0.36, -0.18, 0.3, 0.34, 0.02, 0.54],
    round: [
      -0.5, 0.08, -0.42, -0.28, -0.16, -0.46, 0.2, -0.44, 0.46, -0.2, 0.5, 0.14, 0.28, 0.42, -0.08,
      0.5, -0.4, 0.32,
    ],
    wedge: [
      -0.54, 0.28, -0.42, -0.18, -0.08, -0.54, 0.5, -0.26, 0.42, 0.3, 0.08, 0.48, -0.32, 0.42,
    ],
    lopsided: [
      -0.56, 0.2, -0.5, -0.24, -0.18, -0.5, 0.42, -0.3, 0.54, 0.18, 0.18, 0.48, -0.22, 0.42,
    ],
  };

  const makePoints = (shape: readonly number[], w: number, h: number): number[] => {
    const points: number[] = [];
    for (let index = 0; index < shape.length; index += 2) {
      points.push(shape[index] * w, shape[index + 1] * h);
    }
    return points;
  };

  const container = scene.add.container(x, y).setDepth(depth).setAngle(angle);

  if (kind === 'cluster') {
    const clusterParts = [
      { x: -width * 0.24, y: height * 0.08, w: width * 0.58, h: height * 0.68, colour },
      {
        x: width * 0.12,
        y: -height * 0.12,
        w: width * 0.54,
        h: height * 0.76,
        colour: colour + 0x050505,
      },
      {
        x: width * 0.32,
        y: height * 0.14,
        w: width * 0.38,
        h: height * 0.5,
        colour: colour - 0x030303,
      },
    ];
    for (const [index, part] of clusterParts.entries()) {
      const points = makePoints(shapes[index === 1 ? 'round' : 'lopsided'], part.w, part.h);
      container.add([
        scene.add.polygon(part.x + 5, part.y + 7, points, 0x34484a, 0.24),
        scene.add.polygon(part.x, part.y, points, part.colour, 1).setStrokeStyle(4, 0x465a5c, 0.9),
      ]);
    }
  } else {
    const shape = shapes[kind] ?? shapes.lopsided;
    const points = makePoints(shape, width, height);
    container.add([
      scene.add.polygon(7, 9, points, 0x34484a, 0.28),
      scene.add.polygon(0, 0, points, colour, 1).setStrokeStyle(4, 0x465a5c, 0.92),
      scene.add
        .polygon(
          -width * 0.08,
          -height * 0.13,
          makePoints(shapes.slab, width * 0.42, height * 0.24),
          0xbac7bd,
          0.24,
        )
        .setStrokeStyle(2, 0xd9e1da, 0.1),
    ]);
  }

  const crack = scene.add.graphics();
  crack.lineStyle(3, 0x3f5556, 0.34);
  crack.beginPath();
  crack.moveTo(-width * 0.08, -height * 0.08);
  crack.lineTo(width * 0.02, height * 0.04);
  crack.lineTo(width * 0.14, height * 0.1);
  crack.strokePath();
  container.add(crack);

  return container;
}

function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const a = polygon[current];
    const b = polygon[previous];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 1) + a.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
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
  name(scene.add.container(x, y, objects).setDepth(worldDepthForY(y, 0.76)), `${id}:cave-mouth`);
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

function createBrookEastWoodland(scene: Phaser.Scene): void {
  const woodland = name(
    scene.add.container(0, 0).setDepth(6.2),
    'crystal-brook:east-woodland',
  );

  const treePositions = [
    [3345, 430, 0.78],
    [3470, 455, 1.04],
    [3610, 500, 0.88],
    [3710, 590, 1.16],
    [3380, 720, 0.68],
    [3505, 735, 1.08],
    [3655, 790, 0.94],
    [3750, 900, 1.2],
    [3420, 990, 0.76],
    [3540, 1025, 1.14],
    [3685, 1080, 0.9],
    [3770, 1190, 1.24],
    [3385, 1280, 0.72],
    [3525, 1300, 1.08],
    [3680, 1365, 0.98],
    [3315, 1475, 0.74],
    [3560, 1495, 1.12],
    [3705, 1550, 0.9],
    [3330, 1715, 0.86],
    [3495, 1690, 1.18],
    [3650, 1770, 0.96],
    [3750, 1880, 1.2],
    [3390, 1960, 0.78],
    [3545, 1990, 1.1],
    [3695, 2060, 0.92],
  ] as const;

  for (const [index, [x, y, scale]] of treePositions.entries()) {
    const trunkWidth = (index % 3 === 0 ? 34 : 39) * scale;
    const trunkHeight = (index % 4 === 0 ? 154 : 178) * scale;
    const canopyA = index % 2 === 0 ? 0x2f5f48 : 0x28543f;
    const canopyB = index % 3 === 0 ? 0x42745a : 0x37684f;
    const canopyC = index % 4 === 0 ? 0x4e8261 : 0x46795a;
    const lean = index % 2 === 0 ? -5 : 4;
    const spread = 0.9 + (index % 5) * 0.05;

    woodland.add([
      scene.add
        .rectangle(x, y, trunkWidth, trunkHeight, 0x544638, 1)
        .setStrokeStyle(3, 0x3f372f, 0.84)
        .setAngle(lean),
      scene.add.ellipse(
        x - 42 * scale,
        y - 82 * scale,
        132 * scale * spread,
        100 * scale,
        canopyA,
        0.98,
      ),
      scene.add.ellipse(
        x + 34 * scale,
        y - 100 * scale,
        148 * scale * spread,
        108 * scale,
        canopyB,
        0.97,
      ),
      scene.add.ellipse(
        x + (index % 2 === 0 ? -8 : 12) * scale,
        y - 136 * scale,
        122 * scale,
        92 * scale,
        canopyC,
        0.92,
      ),
    ]);
  }

  for (const [x, y, width, height, angle] of [
    [3370, 1435, 116, 58, -10],
    [3490, 1450, 132, 64, 8],
    [3620, 1510, 126, 60, -6],
    [3410, 1620, 108, 54, 11],
    [3570, 1650, 138, 66, -8],
    [3710, 1670, 122, 58, 6],
    [3440, 1850, 118, 58, -5],
    [3610, 1890, 130, 62, 9],
  ] as const) {
    woodland.add([
      scene.add.ellipse(x, y, width, height, 0x4f8057, 0.86).setAngle(angle),
      scene.add
        .ellipse(x + 30, y - 10, width * 0.72, height * 0.8, 0x5d9361, 0.78)
        .setAngle(-angle),
    ]);
  }

  for (const [x, y, scale] of [
    [3370, 820, 0.42],
    [3540, 1130, 0.5],
    [3460, 1810, 0.46],
  ] as const) {
    woodland.add(
      scene.add
        .triangle(x, y, 0, 34 * scale, 13 * scale, 0, 26 * scale, 34 * scale, 0xa9eaf0, 0.72)
        .setStrokeStyle(2, 0xf0ffff, 0.62),
    );
  }

  // Semantic exit only: the visible language is now just trail + enclosing trees.
  name(
    scene.add
      .zone(
        CRYSTAL_BROOK_WOODS_THRESHOLD.position.x,
        CRYSTAL_BROOK_WOODS_THRESHOLD.position.y,
        160,
        180,
      )
      .setVisible(false),
    'crystal-brook:woods-path-exit',
  );
}

function createCrystalCupRacewayExit(scene: Phaser.Scene, x: number, y: number): void {
  const objects: Phaser.GameObjects.GameObject[] = [];

  objects.push(
    scene.add.rectangle(-118, 28, 28, 176, 0x6ca9b3, 0.94).setStrokeStyle(4, 0xdffcff, 0.76),
    scene.add.rectangle(118, 28, 28, 176, 0x6ca9b3, 0.94).setStrokeStyle(4, 0xdffcff, 0.76),
    scene.add.rectangle(0, 92, 280, 42, 0x8bc9d1, 0.34).setStrokeStyle(3, 0xdffcff, 0.28),
    scene.add.rectangle(0, -48, 300, 64, 0xe8fbff, 0.96).setStrokeStyle(6, 0x8ea7c8, 0.92),
    scene.add
      .text(0, -48, 'THE CRYSTAL CUP RACEWAY', {
        color: '#365965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
    scene.add
      .text(0, 112, '↑', {
        color: '#eaffff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  for (const [dx, dy, scale, colour] of [
    [-146, 42, 1, 0xa6e9ef],
    [-132, 104, 0.72, 0xcbbef1],
    [145, 38, 0.9, 0xb8edf1],
    [136, 104, 0.66, 0xd3c8f3],
  ] as const) {
    objects.push(
      scene.add
        .triangle(dx, dy, 0, 52 * scale, 19 * scale, 0, 38 * scale, 52 * scale, colour, 0.9)
        .setStrokeStyle(3, 0xf4ffff, 0.78),
    );
  }

  name(
    scene.add.container(x, y, objects).setDepth(worldDepthForY(y + 120, 0.82)),
    'crystal-cup-raceway:edge-exit',
  );
}

function toVector2Points(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map(({ x, y }) => new Phaser.Math.Vector2(x, y));
}

function buildRibbonPolygon(points: readonly Point[], width: number): Phaser.Math.Vector2[] {
  const halfWidth = width / 2;
  const left: Phaser.Math.Vector2[] = [];
  const right: Phaser.Math.Vector2[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const point = points[index];

    left.push(
      new Phaser.Math.Vector2(point.x + normalX * halfWidth, point.y + normalY * halfWidth),
    );
    right.push(
      new Phaser.Math.Vector2(point.x - normalX * halfWidth, point.y - normalY * halfWidth),
    );
  }

  return [...left, ...right.reverse()];
}

function fillRibbon(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  colour: number,
  alpha: number,
): void {
  graphics.fillStyle(colour, alpha);
  graphics.fillPoints(buildRibbonPolygon(points, width), true);
}

function createMeadowCrystalBrookGateway(scene: Phaser.Scene): void {
  const gateway = RAINBOW_MEADOW_LAYOUT.crystalBrookGateway;
  const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
  const { pool, waterfall, outletStream } = area;

  const offsetPoints = (points: readonly Point[], xOffset: number, yOffset: number): Point[] =>
    points.map((point) => ({ x: point.x + xOffset, y: point.y + yOffset }));

  const poolShadow = name(scene.add.graphics().setDepth(2.38), 'meadow-crystal-brook:pool-shadow');
  poolShadow.fillStyle(0x355f63, 0.2);
  poolShadow.fillPoints(toVector2Points(offsetPoints(pool.shoreline, 14, 18)), true);

  const shallowWater = name(scene.add.graphics().setDepth(2.52), 'meadow-crystal-brook:pool');
  shallowWater.fillStyle(0x78cbd0, 0.82);
  shallowWater.fillPoints(toVector2Points(pool.shoreline), true);
  // Leave the southern outlet mouth unstroked so the basin and river read as one
  // continuous body of water instead of two outlined shapes laid on top of each other.
  const strokeOpenEdge = (
    graphics: Phaser.GameObjects.Graphics,
    points: readonly Point[],
    gapStart: number,
    gapEnd: number,
  ): void => {
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1, gapStart + 1)) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(points[gapEnd].x, points[gapEnd].y);
    for (const point of [...points.slice(gapEnd + 1), points[0]]) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  };

  shallowWater.lineStyle(9, 0x5f9894, 0.5);
  strokeOpenEdge(shallowWater, pool.shoreline, 10, 13);

  const shallowHighlight = name(
    scene.add.graphics().setDepth(2.54),
    'meadow-crystal-brook:shallow-water',
  );
  const shallowHighlightPoints = pool.shoreline.map((point) => ({
    x: pool.centre.x + (point.x - pool.centre.x) * 0.91,
    y: pool.centre.y + (point.y - pool.centre.y) * 0.88,
  }));
  shallowHighlight.lineStyle(7, 0xc8f5ec, 0.24);
  strokeOpenEdge(shallowHighlight, shallowHighlightPoints, 10, 13);

  const deepWater = name(scene.add.graphics().setDepth(2.55), 'meadow-crystal-brook:deep-water');
  deepWater.fillStyle(0x3f97a6, 0.72);
  deepWater.fillPoints(toVector2Points(pool.deepZone), true);

  const stream = name(scene.add.graphics().setDepth(2.5), 'meadow-crystal-brook:outlet-stream');
  fillRibbon(stream, outletStream.points, outletStream.outerWidth, 0x579aa1, 0.58);
  fillRibbon(stream, outletStream.points, outletStream.innerWidth, 0x7ed0d2, 0.9);

  const deepChannel = name(
    scene.add.graphics().setDepth(2.53),
    'meadow-crystal-brook:deep-outlet-channel',
  );
  fillRibbon(deepChannel, outletStream.points, outletStream.deepWidth, 0x3f97a6, 0.82);

  const waterGlints = name(
    scene.add.graphics().setDepth(2.61),
    'meadow-crystal-brook:water-glints',
  );
  waterGlints.lineStyle(5, 0xeaffff, 0.34);
  for (const [x, y, width] of [
    [2820, 1070, 82],
    [2935, 1320, 110],
    [3140, 1260, 92],
    [3240, 1175, 70],
  ] as const) {
    waterGlints.beginPath();
    waterGlints.moveTo(x - width / 2, y);
    waterGlints.lineTo(x + width / 2, y);
    waterGlints.strokePath();
  }

  for (const [index, stone] of area.steppingStones.entries()) {
    const stoneContainer = addFacetedRock(
      scene,
      stone.x,
      stone.y,
      stone.width,
      stone.height,
      3.06 + index * 0.01,
      0x87958e,
      index,
    )
      .setName(`${DETAIL_PREFIX}:meadow-crystal-brook:stepping-stone:${index}`)
      .setAngle(stone.angle);

    const ripple = name(
      scene.add
        .ellipse(stone.x + 3, stone.y + 16, stone.width * 1.32, stone.height * 0.64, 0x347781, 0.2)
        .setAngle(stone.angle)
        .setDepth(2.88 + index * 0.01),
      `meadow-crystal-brook:stepping-stone-ripple:${index}`,
    );
    scene.tweens.add({
      targets: ripple,
      scaleX: { from: 0.94, to: 1.06 },
      alpha: { from: 0.14, to: 0.28 },
      duration: 1100 + index * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const moss = scene.add
      .ellipse(
        stone.width * 0.16,
        -stone.height * 0.08,
        stone.width * 0.28,
        stone.height * 0.18,
        0x7fa17d,
        0.46,
      )
      .setDepth(0.1);
    stoneContainer.add(moss);
  }

  for (const [index, rock] of area.rocks.entries()) {
    name(
      addNaturalRock(
        scene,
        rock.x,
        rock.y,
        rock.width,
        rock.height,
        worldDepthForY(rock.y, 0.42),
        rock.colour,
        rock.kind,
        rock.angle,
      ),
      `meadow-crystal-brook:gateway-rock:${index}`,
    );
  }

  for (const [index, crystal] of area.crystals.entries()) {
    name(
      addCrystal(
        scene,
        crystal.x,
        crystal.y,
        crystal.scale,
        worldDepthForY(crystal.y, 0.5),
        0x8ce4eb,
      ),
      `meadow-crystal-brook:gateway-crystal:${index}`,
    );
  }

  const waterfallDepth = worldDepthForY(waterfall.y, 0.44);

  name(
    scene.add
      .ellipse(waterfall.x + 4, waterfall.y + 8, 178, 280, 0x20383d, 0.96)
      .setStrokeStyle(6, 0x405b5c, 0.92)
      .setDepth(waterfallDepth - 0.08),
    'meadow-crystal-brook:hidden-recess',
  );
  name(
    scene.add
      .ellipse(waterfall.x + 8, waterfall.y + 80, 134, 96, 0x162c31, 0.96)
      .setDepth(waterfallDepth - 0.06),
    'meadow-crystal-brook:hidden-recess-depth',
  );

  for (const [index, rock] of [
    {
      x: waterfall.x - 58,
      y: waterfall.y - 190,
      width: 126,
      height: 156,
      colour: 0x596d6b,
      kind: 'spire',
      angle: -8,
    },
    {
      x: waterfall.x + 92,
      y: waterfall.y - 158,
      width: 182,
      height: 126,
      colour: 0x53696a,
      kind: 'cluster',
      angle: 4,
    },
    {
      x: waterfall.x + 112,
      y: waterfall.y + 12,
      width: 142,
      height: 204,
      colour: 0x5a706f,
      kind: 'wedge',
      angle: 6,
    },
    {
      x: waterfall.x + 56,
      y: waterfall.y + 190,
      width: 184,
      height: 82,
      colour: 0x627672,
      kind: 'slab',
      angle: -5,
    },
  ].entries()) {
    name(
      addNaturalRock(
        scene,
        rock.x,
        rock.y,
        rock.width,
        rock.height,
        waterfallDepth - 0.04,
        rock.colour,
        rock.kind,
        rock.angle,
      ),
      `meadow-crystal-brook:waterfall-cliff-rock:${index}`,
    );
  }

  const top = -waterfall.height / 2;
  for (const [index, curtainConfig] of waterfall.curtains.entries()) {
    const graphics = scene.add.graphics();
    const isLeft = curtainConfig.side < 0;
    graphics.fillStyle(isLeft ? 0x73d2dc : 0x62c1d0, index % 2 === 0 ? 0.78 : 0.86);
    graphics.fillRoundedRect(
      -curtainConfig.width / 2,
      top,
      curtainConfig.width,
      waterfall.height,
      curtainConfig.width / 2,
    );
    graphics.fillStyle(0xd9ffff, 0.3);
    graphics.fillRoundedRect(
      -curtainConfig.width * 0.12,
      top + 20,
      Math.max(9, curtainConfig.width * 0.22),
      waterfall.height - 42,
      6,
    );
    graphics.fillStyle(0x4eacbd, 0.24);
    graphics.fillRoundedRect(
      curtainConfig.width * 0.18,
      top + 10,
      Math.max(7, curtainConfig.width * 0.16),
      waterfall.height - 30,
      5,
    );

    const curtain = name(
      scene.add
        .container(waterfall.x + curtainConfig.side * curtainConfig.closedOffset, waterfall.y, [
          graphics,
        ])
        .setDepth(waterfallDepth + index * 0.002),
      `meadow-crystal-brook:waterfall-curtain-${curtainConfig.id}`,
    );
    curtain.setData('open', false);
    scene.tweens.add({
      targets: graphics,
      y: { from: -5 - index, to: 5 + index },
      alpha: { from: 0.76, to: 1 },
      duration: 690 + index * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  name(
    scene.add.container(waterfall.x, waterfall.y).setDepth(waterfallDepth - 0.01),
    'meadow-crystal-brook:waterfall',
  );

  name(
    scene.add
      .ellipse(
        waterfall.x,
        waterfall.y - waterfall.height / 2 - 4,
        waterfall.width,
        48,
        0x9ee5e9,
        0.38,
      )
      .setDepth(waterfallDepth + 0.01),
    'meadow-crystal-brook:waterfall-lip',
  );
  name(
    scene.add
      .ellipse(waterfall.x - 4, waterfall.y + waterfall.height / 2 - 10, 280, 96, 0xeaffff, 0.38)
      .setDepth(3.16),
    'meadow-crystal-brook:waterfall-splash',
  );
  name(
    scene.add
      .ellipse(waterfall.x + 18, waterfall.y + waterfall.height / 2 + 12, 220, 68, 0x9fe8ec, 0.32)
      .setDepth(3.17),
    'meadow-crystal-brook:waterfall-foam',
  );

  for (const [index, mist] of area.mist.entries()) {
    const mistObject = name(
      scene.add
        .ellipse(mist.x, mist.y, mist.width, mist.height, 0xeaffff, 0.24 + index * 0.04)
        .setDepth(3.14 + index * 0.01),
      `meadow-crystal-brook:mist:${index}`,
    );
    scene.tweens.add({
      targets: mistObject,
      x: mist.x + (index % 2 === 0 ? -18 : 18),
      alpha: { from: 0.16, to: 0.34 },
      duration: 1200 + index * 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  const wadingRipple = name(
    scene.add
      .ellipse(0, 0, 92, 28, 0xd8ffff, 0.28)
      .setStrokeStyle(3, 0xefffff, 0.38)
      .setVisible(false),
    'meadow-crystal-brook:wading-ripple',
  );
  scene.tweens.add({
    targets: wadingRipple,
    scaleX: { from: 0.82, to: 1.18 },
    scaleY: { from: 0.82, to: 1.08 },
    alpha: { from: 0.12, to: 0.34 },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });

  const sign = scene.add
    .container(area.sign.x, area.sign.y)
    .setDepth(worldDepthForY(area.sign.y, 0.35));
  sign.add([
    scene.add.rectangle(0, 34, 14, 84, 0x765143, 1).setStrokeStyle(3, 0x5a4037, 0.9),
    scene.add.rectangle(0, -8, 218, 62, 0xa9754f, 1).setStrokeStyle(5, 0x684737, 0.95).setAngle(-2),
    scene.add
      .text(0, -8, 'CRYSTAL BROOK  →', {
        color: '#fff1c5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAngle(-2),
  ]);
  name(sign, 'meadow-crystal-brook:sign');
}

function decorateMeadow(scene: Phaser.Scene): void {
  createMeadowCrystalBrookGateway(scene);
}

function updateMeadowCrystalBrookEffects(scene: Phaser.Scene): void {
  const player = scene.children.getByName('world-player-unicorn');
  if (!(player instanceof Phaser.Physics.Arcade.Sprite)) {
    return;
  }

  const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
  const waterfall = area.waterfall;
  const distance = Phaser.Math.Distance.Between(
    player.x,
    player.y,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.y,
  );
  const shouldOpen = distance <= waterfall.openRadius;

  for (const curtainConfig of waterfall.curtains) {
    const curtain = scene.children.getByName(
      `${DETAIL_PREFIX}:meadow-crystal-brook:waterfall-curtain-${curtainConfig.id}`,
    );
    if (!(curtain instanceof Phaser.GameObjects.Container)) {
      continue;
    }
    if (curtain.getData('open') === shouldOpen) {
      continue;
    }
    curtain.setData('open', shouldOpen);
    scene.tweens.killTweensOf(curtain);
    scene.tweens.add({
      targets: curtain,
      x:
        waterfall.x +
        curtainConfig.side * (shouldOpen ? curtainConfig.openOffset : curtainConfig.closedOffset),
      alpha: shouldOpen ? 0.74 : 1,
      duration: shouldOpen ? 320 : 420,
      ease: 'Sine.InOut',
    });
  }

  const ripple = scene.children.getByName(`${DETAIL_PREFIX}:meadow-crystal-brook:wading-ripple`);
  if (ripple instanceof Phaser.GameObjects.Ellipse) {
    const inWater = pointInPolygon({ x: player.x, y: player.y + 18 }, area.pool.shoreline);
    ripple
      .setVisible(inWater)
      .setPosition(player.x, player.y + 30)
      .setDepth(worldDepthForY(player.y, 0.28));
  }
}

function decorateBrook(scene: Phaser.Scene): void {
  createBrookEastWoodland(scene);

  createCrystalCupRacewayExit(
    scene,
    CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.position.x,
    CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.position.y,
  );
  createCaveMouth(
    scene,
    'brook-meadow',
    CRYSTAL_BROOK_MEADOW_THRESHOLD.position.x,
    CRYSTAL_BROOK_MEADOW_THRESHOLD.position.y,
    'Rainbow Meadow',
    0xf1c7e6,
  );

  const cliffs = name(scene.add.container(0, 0).setDepth(7.45), 'crystal-brook:production-upgrade');
  for (const [x, y, width, height] of [
    [520, 410, 360, 190],
    [880, 350, 300, 170],
    [2350, 310, 340, 190],
  ] as const) {
    cliffs.add(addRock(scene, x, y, width, height, 7.45, 0x748985));
    cliffs.add(addRock(scene, x, y - height * 0.16, width * 0.76, height * 0.52, 7.46, 0x8aa09a));
  }
  for (const [x, y, scale] of [
    [430, 470, 1.1],
    [720, 455, 0.8],
    [2260, 420, 1],
    [2460, 410, 0.78],
  ] as const) {
    cliffs.add(addCrystal(scene, x, y, scale, 7.6));
  }
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

  const forest = name(
    scene.add.container(0, 0).setDepth(6.15),
    'whispering-woods:production-upgrade',
  );
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
        if (scene.scene.key === 'RainbowMeadowScene') {
          updateMeadowCrystalBrookEffects(scene);
        }
        continue;
      }
      scene.add.zone(-64, -64, 2, 2).setName(ANCHOR_NAME).setVisible(false);
      decorateScene(scene);
      if (scene.scene.key === 'RainbowMeadowScene') {
        updateMeadowCrystalBrookEffects(scene);
      }
    }
  }
}

let manager: R6RegionGatewayArtManager | null = null;

export function getR6RegionGatewayArtManager(game: Phaser.Game): R6RegionGatewayArtManager {
  manager ??= new R6RegionGatewayArtManager(game);
  return manager;
}
