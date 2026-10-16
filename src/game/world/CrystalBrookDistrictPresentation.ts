import Phaser from 'phaser';
import {
  CRYSTAL_BROOK_CRYSTAL_SITES,
  CRYSTAL_BROOK_GROTTO_THRESHOLD,
  CRYSTAL_BROOK_REFLECTION_POOL,
} from './CrystalBrookMap';
import { worldDepthForY } from './WorldDepth';

// H6.5A: crystals share area-owned positions with their base collision footprints.
type CrystalDistrict = 'gorge' | 'opal' | 'mirror' | 'prism' | 'upstream';
interface CrystalPalette {
  face: number;
  light: number;
  shadow: number;
  glimmer: number;
}
const PALETTES: Record<CrystalDistrict, CrystalPalette> = {
  gorge: { face: 0xa6ddf1, light: 0xe5faff, shadow: 0x628fae, glimmer: 0xb5f0f4 },
  opal: { face: 0xb9c6f6, light: 0xf2ecff, shadow: 0x8475b7, glimmer: 0xe9d5ff },
  mirror: { face: 0x88d7d9, light: 0xe3ffff, shadow: 0x5899a8, glimmer: 0xc5ffff },
  prism: { face: 0xd2a5f1, light: 0xffedff, shadow: 0x9473c2, glimmer: 0xffd4ed },
  upstream: { face: 0x8bdac8, light: 0xeaffeb, shadow: 0x529995, glimmer: 0xc4f7d9 },
};

function polygon(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly (readonly [number, number])[],
): void {
  graphics.fillPoints(
    points.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
    true,
  );
}

function crystalShard(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  foot: number,
  width: number,
  height: number,
  lean: number,
  palette: CrystalPalette,
): void {
  const peak = x + lean;
  graphics.fillStyle(palette.shadow, 0.98);
  polygon(graphics, [
    [x - width * 0.51, foot],
    [x - width * 0.34, foot - height * 0.43],
    [peak, foot - height],
    [x + width * 0.37, foot - height * 0.4],
    [x + width * 0.52, foot],
  ]);
  graphics.fillStyle(palette.face, 0.99);
  polygon(graphics, [
    [x - width * 0.35, foot - height * 0.42],
    [peak, foot - height],
    [x + width * 0.1, foot - height * 0.3],
    [x - width * 0.06, foot],
    [x - width * 0.51, foot],
  ]);
  graphics.fillStyle(palette.light, 0.85);
  polygon(graphics, [
    [peak, foot - height],
    [x + width * 0.37, foot - height * 0.4],
    [x + width * 0.1, foot - height * 0.3],
  ]);
  graphics.fillStyle(palette.glimmer, 0.58);
  polygon(graphics, [
    [x + width * 0.1, foot - height * 0.3],
    [x + width * 0.52, foot],
    [x - width * 0.06, foot],
  ]);
  graphics.lineStyle(1.8, 0xf4ffff, 0.65);
  graphics.beginPath();
  graphics.moveTo(peak, foot - height + 7);
  graphics.lineTo(x - width * 0.06, foot - 6);
  graphics.strokePath();
}

function createCrystalGrove(
  scene: Phaser.Scene,
  site: (typeof CRYSTAL_BROOK_CRYSTAL_SITES)[number],
): void {
  const graphics = scene.add
    .graphics()
    .setPosition(site.x, site.y)
    .setName('crystal-brook:crystal-grove:' + site.id)
    .setDepth(worldDepthForY(site.y, 0.16));
  const palette = PALETTES[site.district];
  const scale = site.scale;
  graphics.fillStyle(0x435f68, 0.2);
  graphics.fillEllipse(0, 13 * scale, 180 * scale, 44 * scale);
  graphics.fillStyle(0x697f82, 0.96);
  polygon(graphics, [
    [-102 * scale, 11 * scale],
    [-72 * scale, -13 * scale],
    [-10 * scale, -23 * scale],
    [60 * scale, -16 * scale],
    [105 * scale, 8 * scale],
    [70 * scale, 27 * scale],
    [-79 * scale, 25 * scale],
  ]);
  graphics.fillStyle(0xa5b8ad, 0.46);
  polygon(graphics, [
    [-72 * scale, -13 * scale],
    [-10 * scale, -23 * scale],
    [60 * scale, -16 * scale],
    [16 * scale, -5 * scale],
    [-35 * scale, -7 * scale],
  ]);
  crystalShard(graphics, -56 * scale, 3 * scale, 42 * scale, 84 * scale, -7 * scale, palette);
  crystalShard(graphics, 24 * scale, 1 * scale, 54 * scale, 139 * scale, 9 * scale, palette);
  crystalShard(graphics, -9 * scale, -4 * scale, 58 * scale, 113 * scale, -12 * scale, palette);
  crystalShard(graphics, 65 * scale, 10 * scale, 31 * scale, 61 * scale, 4 * scale, palette);
  graphics.fillStyle(palette.glimmer, 0.55);
  graphics.fillCircle(-88 * scale, -32 * scale, 3.5 * scale);
  graphics.fillCircle(86 * scale, -67 * scale, 3 * scale);
}

function createCrystalDistrictFloors(scene: Phaser.Scene): void {
  const ground = scene.add
    .graphics()
    .setName('crystal-brook:crystal-district-floors')
    .setDepth(1.24);
  for (const [colour, points] of [
    [
      0xb6dce8,
      [
        [100, 350],
        [960, 310],
        [1320, 710],
        [1100, 1060],
        [250, 900],
      ],
    ],
    [
      0xd6c4e8,
      [
        [1100, 310],
        [2290, 260],
        [2640, 710],
        [2150, 1110],
        [1430, 1000],
      ],
    ],
    [
      0xa9dfe4,
      [
        [1600, 1510],
        [1950, 1440],
        [2520, 1590],
        [2800, 2070],
        [1740, 2060],
      ],
    ],
    [
      0xb8e9d3,
      [
        [2740, 250],
        [3490, 230],
        [3470, 1410],
        [2950, 1250],
      ],
    ],
  ] as const) {
    ground.fillStyle(colour, 0.13);
    polygon(ground, points);
  }
}

export function createCrystalBrookDistrictPresentation(scene: Phaser.Scene): void {
  createCrystalDistrictFloors(scene);
  for (const site of CRYSTAL_BROOK_CRYSTAL_SITES) {
    createCrystalGrove(scene, site);
  }
}

export function createCrystalBrookGrottoPresentation(scene: Phaser.Scene): void {
  const { x, y } = CRYSTAL_BROOK_GROTTO_THRESHOLD.position;
  const graphics = scene.add
    .graphics()
    .setPosition(x, y)
    .setName('crystal-brook:grotto:authored-arch')
    .setDepth(worldDepthForY(y, -0.68));

  graphics.fillStyle(0x384f59, 0.22);
  graphics.fillEllipse(0, 20, 360, 105);
  graphics.fillStyle(0x6a8486, 1);
  polygon(graphics, [
    [-176, 37],
    [-163, -77],
    [-121, -168],
    [-47, -204],
    [45, -200],
    [124, -147],
    [166, -57],
    [176, 38],
  ]);
  graphics.fillStyle(0x8da7a2, 0.66);
  polygon(graphics, [
    [-163, -77],
    [-121, -168],
    [-47, -204],
    [-68, -152],
    [-121, -85],
  ]);
  graphics.fillStyle(0x263c50, 1);
  polygon(graphics, [
    [-92, 34],
    [-89, -55],
    [-59, -108],
    [0, -137],
    [65, -103],
    [93, -47],
    [98, 34],
  ]);
  graphics.fillStyle(0x46617c, 0.52);
  polygon(graphics, [
    [-81, 27],
    [-65, -57],
    [-40, -90],
    [0, -113],
    [0, 32],
  ]);
  graphics.lineStyle(7, 0xbcdddc, 0.7);
  graphics.beginPath();
  graphics.moveTo(-94, 31);
  graphics.lineTo(-89, -55);
  graphics.lineTo(-59, -108);
  graphics.lineTo(0, -137);
  graphics.lineTo(65, -103);
  graphics.lineTo(93, -47);
  graphics.lineTo(98, 31);
  graphics.strokePath();
  graphics.lineStyle(3, PALETTES.prism.light, 0.62);
  graphics.beginPath();
  graphics.moveTo(-124, -94);
  graphics.lineTo(-68, -164);
  graphics.lineTo(-18, -178);
  graphics.strokePath();
  graphics.fillStyle(0xeacbff, 0.54);
  graphics.fillCircle(0, -154, 6);
}

export function createCrystalBrookReflectionPoolPresentation(scene: Phaser.Scene): void {
  const { x, y } = CRYSTAL_BROOK_REFLECTION_POOL;
  const outer = scene.add
    .graphics()
    .setPosition(x, y)
    .setName('crystal-brook:reflection-pool-outer')
    .setDepth(3);
  outer.fillStyle(0x5c9299, 0.78);
  polygon(outer, [
    [-158, 0],
    [-125, -53],
    [-68, -76],
    [28, -70],
    [115, -48],
    [162, -9],
    [128, 41],
    [56, 69],
    [-61, 65],
    [-135, 38],
  ]);
  const inner = scene.add
    .graphics()
    .setPosition(x, y)
    .setName('crystal-brook:reflection-pool-inner')
    .setDepth(3.03);
  inner.fillStyle(0x9ce1e1, 0.79);
  polygon(inner, [
    [-134, -3],
    [-100, -42],
    [-42, -58],
    [35, -54],
    [125, -26],
    [130, 1],
    [89, 43],
    [12, 53],
    [-75, 46],
  ]);
  const deep = scene.add
    .graphics()
    .setPosition(x, y)
    .setName('crystal-brook:reflection-pool-deep')
    .setDepth(3.06);
  deep.fillStyle(0x579ca6, 0.34);
  polygon(deep, [
    [-65, 12],
    [-38, -24],
    [31, -31],
    [73, -5],
    [52, 24],
    [0, 37],
  ]);
  deep.lineStyle(4, 0xedffff, 0.47);
  for (const [fromX, fromY, toX, toY] of [
    [-98, -14, -35, -22],
    [10, 6, 80, 1],
    [-33, 29, 25, 24],
  ] as const) {
    deep.beginPath();
    deep.moveTo(fromX, fromY);
    deep.lineTo(toX, toY);
    deep.strokePath();
  }
}
