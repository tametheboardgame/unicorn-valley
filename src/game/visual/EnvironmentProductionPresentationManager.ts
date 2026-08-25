import Phaser from 'phaser';
import { worldDepthForY } from '../world/WorldDepth';

export type ProductionEnvironmentId =
  | 'moonflower-glade'
  | 'sunbeam-village'
  | 'rainbow-meadow'
  | 'crystal-brook'
  | 'whispering-woods'
  | 'rainbow-run';

type ProductionLayer = 'anchor' | 'background' | 'signature' | 'foreground' | 'ambient';

interface AmbientPoint {
  x: number;
  y: number;
  radius?: number;
}

const SCENE_ENVIRONMENTS: Readonly<Record<string, ProductionEnvironmentId>> = {
  MoonflowerGladeScene: 'moonflower-glade',
  SunbeamVillageScene: 'sunbeam-village',
  RainbowMeadowScene: 'rainbow-meadow',
  CrystalBrookScene: 'crystal-brook',
  WhisperingWoodsScene: 'whispering-woods',
  RaceScene: 'rainbow-run',
  NovaTutorialRaceScene: 'rainbow-run',
};

export function environmentProductionName(
  environment: ProductionEnvironmentId,
  layer: ProductionLayer,
): string {
  return `environment-production:${environment}:${layer}`;
}

function nameObject<T extends Phaser.GameObjects.GameObject>(
  object: T,
  environment: ProductionEnvironmentId,
  layer: ProductionLayer,
): T {
  object.setName(environmentProductionName(environment, layer));
  return object;
}

function addAmbientMotes(
  scene: Phaser.Scene,
  environment: ProductionEnvironmentId,
  points: readonly AmbientPoint[],
  colour: number,
  depth: number,
  drift = 14,
): void {
  const motes = points.map((point, index) => {
    const mote = scene.add.circle(
      point.x,
      point.y,
      point.radius ?? 5,
      colour,
      0.18 + (index % 3) * 0.08,
    );
    scene.tweens.add({
      targets: mote,
      y: point.y - drift - (index % 2) * 6,
      alpha: { from: 0.16, to: 0.74 },
      duration: 1250 + index * 170,
      delay: index * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return mote;
  });

  nameObject(scene.add.container(0, 0, motes).setDepth(depth), environment, 'ambient');
}

function createLeafCluster(
  scene: Phaser.Scene,
  environment: ProductionEnvironmentId,
  x: number,
  y: number,
  colours: readonly [number, number, number],
  flip = false,
): Phaser.GameObjects.Container {
  const direction = flip ? -1 : 1;
  const stem = scene.add
    .rectangle(direction * -8, 14, 12, 116, colours[2], 0.82)
    .setAngle(direction * -18);
  const leaves = [
    scene.add.ellipse(direction * -42, -36, 82, 44, colours[0], 0.96).setAngle(direction * 24),
    scene.add.ellipse(direction * 18, -68, 94, 50, colours[1], 0.96).setAngle(direction * -18),
    scene.add.ellipse(direction * 42, -8, 76, 42, colours[0], 0.92).setAngle(direction * -28),
    scene.add.ellipse(direction * -24, 26, 70, 38, colours[1], 0.9).setAngle(direction * 18),
  ];
  const highlight = scene.add.ellipse(direction * 16, -72, 44, 18, 0xffffff, 0.12);
  const container = scene.add
    .container(x, y, [stem, ...leaves, highlight])
    .setDepth(worldDepthForY(y + 55, 0.7));
  nameObject(container, environment, 'foreground');
  return container;
}

function createMoonflowerGladeProduction(scene: Phaser.Scene): void {
  const environment = 'moonflower-glade';
  const background = nameObject(scene.add.graphics().setDepth(1.35), environment, 'background');
  background.fillStyle(0xd8c8ef, 0.12);
  background.fillEllipse(580, 360, 980, 650);
  background.fillStyle(0xb9ebcf, 0.2);
  background.fillEllipse(2050, 1390, 1160, 610);
  background.fillStyle(0xe9f7d0, 0.14);
  background.fillEllipse(2250, 430, 820, 470);

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  for (const [x, y, scale] of [
    [1870, 1510, 0.9],
    [1980, 1560, 1.05],
    [2100, 1518, 0.82],
    [2210, 1580, 1],
    [2320, 1515, 0.88],
  ] as const) {
    const stem = scene.add.rectangle(x, y, 7 * scale, 58 * scale, 0x5b966e, 0.92);
    const glow = scene.add.circle(x, y - 38 * scale, 32 * scale, 0xe0b4ff, 0.1);
    const petals = [0, 1, 2, 3, 4].map((index) => {
      const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
      return scene.add.ellipse(
        x + Math.cos(angle) * 15 * scale,
        y - 38 * scale + Math.sin(angle) * 15 * scale,
        20 * scale,
        30 * scale,
        index % 2 === 0 ? 0xd6a6f1 : 0xf0b9e1,
        0.9,
      );
    });
    const centre = scene.add.circle(x, y - 38 * scale, 8 * scale, 0xffed9e, 0.96);
    signature.add([stem, glow, ...petals, centre]);
  }
  signature.setDepth(worldDepthForY(1585, 0.18));

  createLeafCluster(scene, environment, 260, 1660, [0x4f8b67, 0x6ba978, 0x6d5b45]);
  createLeafCluster(scene, environment, 2540, 1645, [0x4b8464, 0x77b77f, 0x6b5942], true);

  addAmbientMotes(
    scene,
    environment,
    [
      { x: 430, y: 920, radius: 6 },
      { x: 1010, y: 520, radius: 5 },
      { x: 1660, y: 720, radius: 6 },
      { x: 1960, y: 980, radius: 5 },
      { x: 2380, y: 760, radius: 6 },
      { x: 2220, y: 1420, radius: 5 },
    ],
    0xfff2a8,
    18,
    18,
  );
}

function createSunbeamVillageProduction(scene: Phaser.Scene): void {
  const environment = 'sunbeam-village';
  const background = nameObject(scene.add.graphics().setDepth(1.35), environment, 'background');
  background.fillStyle(0xffefb3, 0.18);
  background.fillEllipse(730, 520, 1180, 710);
  background.fillStyle(0xc8eba2, 0.14);
  background.fillEllipse(2250, 1390, 1500, 720);
  background.fillStyle(0xffd9b1, 0.12);
  background.fillEllipse(2420, 460, 980, 580);

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  const flowerColours = [0xef8fa9, 0xf5c968, 0x7cc6d8, 0x9fca7a, 0xc89cda];
  for (const [x, y, width] of [
    [790, 635, 110],
    [1190, 600, 96],
    [1650, 620, 118],
    [2100, 590, 102],
    [2460, 640, 112],
  ] as const) {
    const basket = scene.add
      .rectangle(x, y, width, 20, 0xb07855, 0.76)
      .setStrokeStyle(3, 0x8b5f49, 0.42);
    signature.add(basket);
    for (let index = 0; index < 4; index += 1) {
      signature.add(
        scene.add.circle(
          x - width * 0.32 + index * (width * 0.21),
          y - 13 - (index % 2) * 6,
          11,
          flowerColours[(index + Math.floor(x / 100)) % flowerColours.length],
          0.84,
        ),
      );
    }
  }
  signature.setDepth(15.5);

  const wisps = [900, 2110].map((x, index) => {
    const wisp = scene.add
      .ellipse(x + 55, 245 + index * 8, 34, 88, 0xfff8e6, 0.18)
      .setAngle(index === 0 ? 18 : -12);
    scene.tweens.add({
      targets: wisp,
      y: wisp.y - 24,
      alpha: { from: 0.08, to: 0.28 },
      scaleX: 1.25,
      duration: 2100 + index * 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return wisp;
  });
  nameObject(scene.add.container(0, 0, wisps).setDepth(11), environment, 'ambient');

  createLeafCluster(scene, environment, 245, 1725, [0x6aa96f, 0x88bf74, 0x806348]);
  createLeafCluster(scene, environment, 2750, 1705, [0x68a56c, 0x8fc178, 0x806348], true);
}

function createRainbowMeadowProduction(scene: Phaser.Scene): void {
  const environment = 'rainbow-meadow';
  const background = nameObject(scene.add.graphics().setDepth(1.35), environment, 'background');
  background.fillStyle(0xd9f0a9, 0.18);
  background.fillEllipse(780, 490, 1400, 780);
  background.fillStyle(0xb4e8c4, 0.14);
  background.fillEllipse(2060, 1550, 1500, 730);
  background.fillStyle(0xffefab, 0.12);
  background.fillEllipse(2840, 640, 1060, 680);

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  const ribbonColours = [0xef8eaa, 0xf3bd65, 0x80c8df, 0x91cd80, 0xcaa0df];
  for (let index = 0; index < ribbonColours.length; index += 1) {
    signature.add(
      scene.add
        .ellipse(2660, 515, 520 - index * 34, 250 - index * 18)
        .setStrokeStyle(10, ribbonColours[index], 0.34)
        .setFillStyle(0xffffff, 0),
    );
  }

  for (const [x, y, scale] of [
    [620, 640, 0.72],
    [700, 610, 0.62],
    [775, 660, 0.68],
  ] as const) {
    const archColours = [0xef8eaa, 0xf3bd65, 0x80c8df];
    archColours.forEach((colour, index) => {
      signature.add(
        scene.add
          .ellipse(x, y, (150 - index * 18) * scale, (76 - index * 10) * scale)
          .setStrokeStyle(7 * scale, colour, 0.34)
          .setFillStyle(0xffffff, 0),
      );
    });
  }
  signature.setDepth(8.2);

  for (const [x, y, colour] of [
    [530, 1510, 0xef93b8],
    [660, 1570, 0xf2c469],
    [800, 1515, 0x8acbda],
    [3060, 1525, 0xc49ee0],
    [3180, 1580, 0xf1a2bb],
  ] as const) {
    const stem = scene.add.rectangle(x, y, 7, 64, 0x609867, 0.86);
    const bloom = scene.add.circle(x, y - 38, 18, colour, 0.9);
    const centre = scene.add.circle(x, y - 38, 7, 0xfff1a8, 0.95);
    signature.add([stem, bloom, centre]);
  }

  createLeafCluster(scene, environment, 330, 1810, [0x4f9362, 0x72ae70, 0x735b43]);
  createLeafCluster(scene, environment, 3200, 1790, [0x4b8c5f, 0x80b96f, 0x735b43], true);

  addAmbientMotes(
    scene,
    environment,
    [
      { x: 720, y: 720, radius: 4 },
      { x: 1260, y: 430, radius: 5 },
      { x: 1960, y: 760, radius: 4 },
      { x: 2380, y: 1320, radius: 5 },
      { x: 2940, y: 900, radius: 4 },
    ],
    0xfff4bd,
    17,
    12,
  );
}

function createCrystalBrookProduction(scene: Phaser.Scene): void {
  const environment = 'crystal-brook';
  const background = nameObject(scene.add.graphics().setDepth(1.35), environment, 'background');
  background.fillStyle(0xc8f1d1, 0.14);
  background.fillEllipse(650, 480, 1300, 760);
  background.fillStyle(0xb9e9eb, 0.14);
  background.fillEllipse(1950, 1320, 1540, 760);
  background.fillStyle(0xd9f4c7, 0.1);
  background.fillEllipse(3030, 520, 1120, 660);

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  for (const [x, y, width] of [
    [1280, 505, 110],
    [1450, 585, 86],
    [1840, 1090, 120],
    [2210, 1190, 92],
    [2700, 1280, 108],
  ] as const) {
    const glint = scene.add.ellipse(x, y, width, 13, 0xe8ffff, 0.38);
    scene.tweens.add({
      targets: glint,
      alpha: { from: 0.16, to: 0.58 },
      scaleX: 1.14,
      duration: 1350 + (x % 5) * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    signature.add(glint);
  }
  signature.setDepth(5.7);

  createLeafCluster(scene, environment, 310, 1830, [0x4e9271, 0x71b28a, 0x665546]);
  createLeafCluster(scene, environment, 3290, 1810, [0x4b8c6d, 0x7cba8e, 0x665546], true);

  addAmbientMotes(
    scene,
    environment,
    [
      { x: 980, y: 690, radius: 4 },
      { x: 1530, y: 780, radius: 4 },
      { x: 2070, y: 650, radius: 5 },
      { x: 2530, y: 1530, radius: 4 },
      { x: 3110, y: 820, radius: 5 },
    ],
    0xd9fbff,
    17,
    20,
  );
}

function createWhisperingWoodsProduction(scene: Phaser.Scene): void {
  const environment = 'whispering-woods';
  const background = nameObject(scene.add.graphics().setDepth(1.35), environment, 'background');
  background.fillStyle(0x7eb093, 0.09);
  background.fillEllipse(700, 460, 1220, 760);
  background.fillStyle(0x203e42, 0.2);
  background.fillEllipse(1910, 1510, 1640, 820);
  background.fillStyle(0x426b66, 0.13);
  background.fillEllipse(2960, 620, 1100, 720);

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  const shaft = scene.add.graphics();
  shaft.fillStyle(0xcfe9bf, 0.06);
  shaft.fillTriangle(620, 0, 940, 0, 1260, 1120);
  shaft.fillTriangle(2260, 0, 2460, 0, 2130, 980);
  signature.add(shaft);
  for (const [x, y, colour] of [
    [1030, 1440, 0xbddbf0],
    [1100, 1500, 0xd9c8f1],
    [1190, 1435, 0xb9edc5],
    [2820, 1510, 0xc6e6ff],
    [2910, 1560, 0xd8c6f4],
  ] as const) {
    const stem = scene.add.rectangle(x, y, 8, 44, 0x547863, 0.8);
    const cap = scene.add.ellipse(x, y - 24, 54, 28, colour, 0.82);
    const glow = scene.add.circle(x, y - 22, 40, colour, 0.08);
    signature.add([stem, cap, glow]);
  }
  signature.setDepth(6.5);

  createLeafCluster(scene, environment, 290, 1820, [0x244d40, 0x376756, 0x4e4237]);
  createLeafCluster(scene, environment, 3240, 1800, [0x24493e, 0x3c6d58, 0x4e4237], true);

  addAmbientMotes(
    scene,
    environment,
    [
      { x: 720, y: 670, radius: 5 },
      { x: 1320, y: 760, radius: 4 },
      { x: 1780, y: 1360, radius: 5 },
      { x: 2360, y: 650, radius: 4 },
      { x: 2840, y: 1280, radius: 5 },
      { x: 3090, y: 850, radius: 4 },
    ],
    0xc8f6bc,
    17,
    24,
  );
}

function createRainbowRunProduction(scene: Phaser.Scene): void {
  const environment = 'rainbow-run';
  const background = nameObject(scene.add.container(0, 0), environment, 'background');
  background.setDepth(-5).setScrollFactor(0.16, 1);
  const ribbonColours = [0xef91aa, 0xf1c269, 0x82c8df, 0x8dcd81, 0xc79fdd];
  ribbonColours.forEach((colour, index) => {
    background.add(
      scene.add
        .ellipse(1040 + index * 18, 165 + index * 5, 780 - index * 46, 290 - index * 18)
        .setStrokeStyle(9, colour, 0.2)
        .setFillStyle(0xffffff, 0),
    );
  });

  const signature = nameObject(scene.add.container(0, 0), environment, 'signature');
  signature.setDepth(4).setScrollFactor(0.58, 1);
  ribbonColours.slice(0, 3).forEach((colour, index) => {
    signature.add(
      scene.add
        .ellipse(930 + index * 30, 325 + index * 9, 1040 - index * 80, 330 - index * 34)
        .setStrokeStyle(8, colour, 0.12)
        .setFillStyle(0xffffff, 0),
    );
  });

  addAmbientMotes(
    scene,
    environment,
    [
      { x: 230, y: 205, radius: 4 },
      { x: 520, y: 245, radius: 4 },
      { x: 790, y: 190, radius: 5 },
      { x: 1080, y: 235, radius: 4 },
    ],
    0xffffff,
    5,
    8,
  );
}

function decorateScene(scene: Phaser.Scene, environment: ProductionEnvironmentId): void {
  switch (environment) {
    case 'moonflower-glade':
      createMoonflowerGladeProduction(scene);
      break;
    case 'sunbeam-village':
      createSunbeamVillageProduction(scene);
      break;
    case 'rainbow-meadow':
      createRainbowMeadowProduction(scene);
      break;
    case 'crystal-brook':
      createCrystalBrookProduction(scene);
      break;
    case 'whispering-woods':
      createWhisperingWoodsProduction(scene);
      break;
    case 'rainbow-run':
      createRainbowRunProduction(scene);
      break;
  }
}

export class EnvironmentProductionPresentationManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      const environment = SCENE_ENVIRONMENTS[scene.scene.key];
      if (!environment) {
        continue;
      }
      const anchorName = environmentProductionName(environment, 'anchor');
      if (scene.children.getByName(anchorName)) {
        continue;
      }

      nameObject(scene.add.zone(-64, -64, 2, 2).setVisible(false), environment, 'anchor');
      decorateScene(scene, environment);
    }
  }
}

let browserEnvironmentProductionPresentationManager: EnvironmentProductionPresentationManager | null =
  null;

export function getEnvironmentProductionPresentationManager(
  game: Phaser.Game,
): EnvironmentProductionPresentationManager {
  browserEnvironmentProductionPresentationManager ??= new EnvironmentProductionPresentationManager(
    game,
  );
  return browserEnvironmentProductionPresentationManager;
}
