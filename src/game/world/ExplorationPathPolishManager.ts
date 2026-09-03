import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const PATH_POLISH_ANCHOR = 'exploration-path-polish-anchor';
const PATH_POLISH_NAME = 'exploration-path-polish';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: readonly Point[];
  width: number;
  colour: number;
  alpha: number;
  depth: number;
}

const PATHS: Readonly<Partial<Record<string, readonly Stroke[]>>> = {
  MoonflowerGladeScene: [
    {
      points: [
        { x: 560, y: 720 },
        { x: 830, y: 820 },
        { x: 1100, y: 870 },
        { x: 1400, y: 900 },
        { x: 1750, y: 900 },
        { x: 2150, y: 900 },
        { x: 2690, y: 900 },
      ],
      width: 128,
      colour: 0xd7c18f,
      alpha: 1,
      depth: 2.42,
    },
    {
      points: [
        { x: 560, y: 720 },
        { x: 830, y: 820 },
        { x: 1100, y: 870 },
        { x: 1400, y: 900 },
        { x: 1750, y: 900 },
        { x: 2150, y: 900 },
        { x: 2690, y: 900 },
      ],
      width: 108,
      colour: 0xf0dfb2,
      alpha: 1,
      depth: 2.43,
    },
    {
      points: [
        { x: 1770, y: 930 },
        { x: 1840, y: 1160 },
        { x: 1940, y: 1420 },
        { x: 1980, y: 1720 },
      ],
      width: 84,
      colour: 0xf0dfb2,
      alpha: 0.96,
      depth: 2.43,
    },
  ],
  SunbeamVillageScene: [
    {
      points: [
        { x: 120, y: 950 },
        { x: 760, y: 950 },
        { x: 1500, y: 1050 },
        { x: 2240, y: 950 },
        { x: 2880, y: 950 },
      ],
      width: 140,
      colour: 0xd7c18f,
      alpha: 1,
      depth: 2.42,
    },
    {
      points: [
        { x: 120, y: 950 },
        { x: 760, y: 950 },
        { x: 1500, y: 1050 },
        { x: 2240, y: 950 },
        { x: 2880, y: 950 },
      ],
      width: 116,
      colour: 0xf0dfb2,
      alpha: 1,
      depth: 2.43,
    },
    ...[900, 1500, 2110].map(
      (x): Stroke => ({
        points: [
          { x, y: x === 900 ? 710 : x === 1500 ? 690 : 720 },
          { x, y: x === 900 ? 625 : x === 1500 ? 585 : 635 },
        ],
        width: 78,
        colour: 0xf0dfb2,
        alpha: 0.96,
        depth: 2.43,
      }),
    ),
  ],
  RainbowMeadowScene: [
    {
      points: [
        { x: 100, y: 1050 },
        { x: 760, y: 1050 },
        { x: 1330, y: 1110 },
        { x: 1900, y: 1040 },
        { x: 2350, y: 1050 },
        { x: 3190, y: 1040 },
      ],
      width: 108,
      colour: 0xf0dfb2,
      alpha: 0.98,
      depth: 2.43,
    },
    {
      points: [
        { x: 1110, y: 1065 },
        { x: 1190, y: 610 },
      ],
      width: 58,
      colour: 0xf0dfb2,
      alpha: 0.94,
      depth: 2.43,
    },
    {
      points: [
        { x: 1800, y: 1050 },
        { x: 1850, y: 1610 },
      ],
      width: 58,
      colour: 0xf0dfb2,
      alpha: 0.94,
      depth: 2.43,
    },
  ],
  CrystalBrookScene: [
    {
      points: [
        { x: 100, y: 1090 },
        { x: 850, y: 1090 },
        { x: 1510, y: 1260 },
        { x: 2050, y: 1080 },
        { x: 2600, y: 1190 },
        { x: 3230, y: 990 },
      ],
      width: 72,
      colour: 0xf4e8c5,
      alpha: 0.94,
      depth: 2.44,
    },
  ],
  WhisperingWoodsScene: [
    {
      points: [
        { x: 100, y: 1090 },
        { x: 720, y: 1090 },
        { x: 1230, y: 980 },
        { x: 1680, y: 1110 },
        { x: 2090, y: 1080 },
        { x: 2530, y: 930 },
        { x: 2940, y: 820 },
      ],
      width: 104,
      colour: 0x866f57,
      alpha: 0.86,
      depth: 2.42,
    },
    {
      points: [
        { x: 1180, y: 980 },
        { x: 1180, y: 620 },
      ],
      width: 54,
      colour: 0x7b684f,
      alpha: 0.68,
      depth: 2.43,
    },
    {
      points: [
        { x: 2170, y: 1050 },
        { x: 2340, y: 1320 },
        { x: 2810, y: 1590 },
      ],
      width: 54,
      colour: 0x7b684f,
      alpha: 0.68,
      depth: 2.43,
    },
  ],
  StarlightBeachScene: [
    {
      points: [
        { x: 100, y: 1140 },
        { x: 650, y: 1120 },
        { x: 1120, y: 1080 },
        { x: 1510, y: 1190 },
        { x: 1900, y: 1330 },
        { x: 2370, y: 1180 },
        { x: 2830, y: 1320 },
        { x: 3220, y: 1500 },
      ],
      width: 94,
      colour: 0xe7c789,
      alpha: 0.76,
      depth: 3.08,
    },
  ],
};

function drawRoundedStroke(scene: Phaser.Scene, stroke: Stroke): void {
  if (stroke.points.length < 2) {
    return;
  }
  const graphics = scene.add.graphics().setName(PATH_POLISH_NAME).setDepth(stroke.depth);
  graphics.lineStyle(stroke.width, stroke.colour, stroke.alpha);
  graphics.beginPath();
  graphics.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (const point of stroke.points.slice(1)) {
    graphics.lineTo(point.x, point.y);
  }
  graphics.strokePath();
  graphics.fillStyle(stroke.colour, stroke.alpha);
  for (const point of stroke.points) {
    graphics.fillCircle(point.x, point.y, stroke.width / 2);
  }
}

export class ExplorationPathPolishManager {
  private readonly refresh = new RefreshThrottle(120);

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
      const strokes = PATHS[scene.scene.key];
      if (!strokes || scene.children.getByName(PATH_POLISH_ANCHOR)) {
        continue;
      }
      scene.add.zone(-64, -64, 2, 2).setName(PATH_POLISH_ANCHOR).setVisible(false);
      for (const stroke of strokes) {
        drawRoundedStroke(scene, stroke);
      }
    }
  }
}

let manager: ExplorationPathPolishManager | null = null;

export function getExplorationPathPolishManager(game: Phaser.Game): ExplorationPathPolishManager {
  manager ??= new ExplorationPathPolishManager(game);
  return manager;
}
