import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
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

function createCascadeRaceGate(scene: Phaser.Scene, x: number, y: number): void {
  const objects: Phaser.GameObjects.GameObject[] = [];
  objects.push(
    scene.add.ellipse(0, 62, 250, 60, 0x65d5dc, 0.2),
    scene.add.rectangle(-82, 0, 32, 210, 0x4d8d99, 1).setStrokeStyle(4, 0xbef3f3, 0.75),
    scene.add.rectangle(82, 0, 32, 210, 0x4d8d99, 1).setStrokeStyle(4, 0xbef3f3, 0.75),
    scene.add.rectangle(0, -88, 198, 48, 0xcaf6f3, 1).setStrokeStyle(5, 0x7189c3, 0.9),
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

function toVector2Points(points: readonly Point[]): Phaser.Math.Vector2[] {
  return points.map(({ x, y }) => new Phaser.Math.Vector2(x, y));
}

function drawRoundedStrokeInto(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  colour: number,
  alpha: number,
): void {
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
  shallowWater.lineStyle(9, 0x5f9894, 0.5);
  shallowWater.strokePoints(toVector2Points(pool.shoreline), true);

  const shallowHighlight = name(
    scene.add.graphics().setDepth(2.54),
    'meadow-crystal-brook:shallow-water',
  );
  shallowHighlight.lineStyle(7, 0xc8f5ec, 0.24);
  shallowHighlight.strokePoints(
    toVector2Points(
      pool.shoreline.map((point) => ({
        x: pool.centre.x + (point.x - pool.centre.x) * 0.91,
        y: pool.centre.y + (point.y - pool.centre.y) * 0.88,
      })),
    ),
    true,
  );

  const deepWater = name(scene.add.graphics().setDepth(2.55), 'meadow-crystal-brook:deep-water');
  deepWater.fillStyle(0x3f97a6, 0.72);
  deepWater.fillPoints(toVector2Points(pool.deepZone), true);
  deepWater.lineStyle(4, 0x2e7788, 0.3);
  deepWater.strokePoints(toVector2Points(pool.deepZone), true);

  const stream = name(scene.add.graphics().setDepth(2.5), 'meadow-crystal-brook:outlet-stream');
  drawRoundedStrokeInto(stream, outletStream.points, outletStream.outerWidth, 0x579aa1, 0.58);
  drawRoundedStrokeInto(stream, outletStream.points, outletStream.innerWidth, 0x7ed0d2, 0.9);
  stream.lineStyle(5, 0xd9ffff, 0.24);
  stream.beginPath();
  stream.moveTo(outletStream.points[0].x - 8, outletStream.points[0].y);
  for (const point of outletStream.points.slice(1)) {
    stream.lineTo(point.x - 8, point.y);
  }
  stream.strokePath();

  name(
    scene.add
      .ellipse(area.dryLanding.x + 15, area.dryLanding.y + 12, 250, 150, 0x8cab80, 0.42)
      .setStrokeStyle(5, 0x769270, 0.26)
      .setDepth(2.58),
    'meadow-crystal-brook:dry-landing',
  );
  name(
    scene.add
      .ellipse(area.leftBank.x - 12, area.leftBank.y + 12, 170, 108, 0xa1b591, 0.28)
      .setDepth(2.6),
    'meadow-crystal-brook:left-bank-stone',
  );

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
      addFacetedRock(
        scene,
        rock.x,
        rock.y,
        rock.width,
        rock.height,
        worldDepthForY(rock.y, 0.42),
        rock.colour,
        rock.variant,
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
    { x: waterfall.x - 112, y: waterfall.y - 118, width: 226, height: 176, colour: 0x596d6b },
    { x: waterfall.x + 108, y: waterfall.y - 96, width: 250, height: 202, colour: 0x53696a },
    { x: waterfall.x - 118, y: waterfall.y + 96, width: 184, height: 158, colour: 0x627672 },
    { x: waterfall.x + 112, y: waterfall.y + 108, width: 208, height: 172, colour: 0x5a706f },
  ].entries()) {
    name(
      addFacetedRock(
        scene,
        rock.x,
        rock.y,
        rock.width,
        rock.height,
        waterfallDepth - 0.04,
        rock.colour,
        index,
      ),
      `meadow-crystal-brook:waterfall-cliff-rock:${index}`,
    );
  }

  const top = -waterfall.height / 2;
  const makeCurtain = (
    side: 'left' | 'right',
    x: number,
    localOffset: number,
  ): Phaser.GameObjects.Container => {
    const graphics = scene.add.graphics();
    graphics.fillStyle(side === 'left' ? 0x73d2dc : 0x62c1d0, 0.8);
    graphics.fillRoundedRect(localOffset - 30, top, 58, waterfall.height, 24);
    graphics.fillStyle(0xd9ffff, 0.28);
    graphics.fillRoundedRect(localOffset - 10, top + 20, 13, waterfall.height - 42, 7);
    graphics.fillStyle(0x4eacbd, 0.28);
    graphics.fillRoundedRect(localOffset + 12, top + 8, 10, waterfall.height - 28, 5);

    const curtain = name(
      scene.add.container(x, waterfall.y, [graphics]).setDepth(waterfallDepth),
      `meadow-crystal-brook:waterfall-curtain-${side}`,
    );
    scene.tweens.add({
      targets: graphics,
      y: { from: -5, to: 6 },
      alpha: { from: 0.78, to: 1 },
      duration: side === 'left' ? 720 : 810,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    curtain.setData('open', false);
    return curtain;
  };

  makeCurtain('left', waterfall.x - waterfall.closedCurtainOffset, -20);
  makeCurtain('right', waterfall.x + waterfall.closedCurtainOffset, 20);

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

  name(
    scene.add
      .text(area.dryLanding.x - 25, area.dryLanding.y + 118, gateway.label, {
        color: '#385c62',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#e9ffffd8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(area.dryLanding.y, 0.25)),
    'meadow-crystal-brook:bank-sign',
  );
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
  const leftCurtain = scene.children.getByName(
    `${DETAIL_PREFIX}:meadow-crystal-brook:waterfall-curtain-left`,
  );
  const rightCurtain = scene.children.getByName(
    `${DETAIL_PREFIX}:meadow-crystal-brook:waterfall-curtain-right`,
  );
  const distance = Phaser.Math.Distance.Between(
    player.x,
    player.y,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.y,
  );
  const shouldOpen = distance <= waterfall.openRadius;

  for (const [curtain, side] of [
    [leftCurtain, -1],
    [rightCurtain, 1],
  ] as const) {
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
        side * (shouldOpen ? waterfall.openCurtainOffset : waterfall.closedCurtainOffset),
      alpha: shouldOpen ? 0.72 : 1,
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
