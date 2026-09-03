import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { EXPLORATION_MAIN_ROUTES, type ExplorationPathPoint } from './ExplorationPathRoutes';

const PATH_POLISH_ANCHOR = 'exploration-path-polish-anchor';
const PATH_POLISH_NAME = 'exploration-path-polish';

interface Stroke {
  points: readonly ExplorationPathPoint[];
  width: number;
  colour: number;
  alpha: number;
  depth: number;
}

const PATHS: Readonly<Partial<Record<string, readonly Stroke[]>>> = {
  MoonflowerGladeScene: [
    { points: EXPLORATION_MAIN_ROUTES.MoonflowerGladeScene, width: 128, colour: 0xd7c18f, alpha: 1, depth: 2.42 },
    { points: EXPLORATION_MAIN_ROUTES.MoonflowerGladeScene, width: 108, colour: 0xf0dfb2, alpha: 1, depth: 2.43 },
    { points: [{ x: 1770, y: 930 }, { x: 1840, y: 1160 }, { x: 1940, y: 1420 }, { x: 1980, y: 1720 }], width: 84, colour: 0xf0dfb2, alpha: 0.96, depth: 2.43 },
  ],
  SunbeamVillageScene: [
    { points: EXPLORATION_MAIN_ROUTES.SunbeamVillageScene, width: 122, colour: 0xe0bd82, alpha: 0.95, depth: 3.18 },
    { points: EXPLORATION_MAIN_ROUTES.SunbeamVillageScene, width: 94, colour: 0xf7e9c5, alpha: 0.98, depth: 3.19 },
    { points: [{ x: 900, y: 950 }, { x: 900, y: 710 }, { x: 900, y: 625 }], width: 72, colour: 0xf7e9c5, alpha: 0.96, depth: 3.19 },
    { points: [{ x: 1500, y: 850 }, { x: 1500, y: 690 }, { x: 1500, y: 585 }], width: 72, colour: 0xf7e9c5, alpha: 0.96, depth: 3.19 },
    { points: [{ x: 2110, y: 950 }, { x: 2110, y: 720 }, { x: 2110, y: 635 }], width: 72, colour: 0xf7e9c5, alpha: 0.96, depth: 3.19 },
  ],
  RainbowMeadowScene: [
    { points: EXPLORATION_MAIN_ROUTES.RainbowMeadowScene, width: 108, colour: 0xf0dfb2, alpha: 0.98, depth: 2.43 },
    { points: [{ x: 1110, y: 1065 }, { x: 1190, y: 610 }], width: 58, colour: 0xf0dfb2, alpha: 0.94, depth: 2.43 },
    { points: [{ x: 1800, y: 1050 }, { x: 1850, y: 1610 }], width: 58, colour: 0xf0dfb2, alpha: 0.94, depth: 2.43 },
  ],
  CrystalBrookScene: [
    { points: EXPLORATION_MAIN_ROUTES.CrystalBrookScene, width: 72, colour: 0xf4e8c5, alpha: 0.94, depth: 2.44 },
  ],
  WhisperingWoodsScene: [
    { points: EXPLORATION_MAIN_ROUTES.WhisperingWoodsScene, width: 104, colour: 0x866f57, alpha: 0.86, depth: 2.42 },
    { points: [{ x: 1180, y: 980 }, { x: 1180, y: 620 }], width: 54, colour: 0x7b684f, alpha: 0.68, depth: 2.43 },
    { points: [{ x: 2170, y: 1050 }, { x: 2340, y: 1320 }, { x: 2810, y: 1590 }], width: 54, colour: 0x7b684f, alpha: 0.68, depth: 2.43 },
  ],
  StarlightBeachScene: [
    { points: EXPLORATION_MAIN_ROUTES.StarlightBeachScene, width: 104, colour: 0xe7c789, alpha: 0.9, depth: 3.08 },
  ],
};

function drawRoundedStroke(scene: Phaser.Scene, stroke: Stroke): void {
  if (stroke.points.length < 2) return;
  const graphics = scene.add.graphics().setName(PATH_POLISH_NAME).setDepth(stroke.depth);
  graphics.lineStyle(stroke.width, stroke.colour, stroke.alpha);
  graphics.beginPath();
  graphics.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (const point of stroke.points.slice(1)) graphics.lineTo(point.x, point.y);
  graphics.strokePath();
  graphics.fillStyle(stroke.colour, stroke.alpha);
  for (const point of stroke.points) graphics.fillCircle(point.x, point.y, stroke.width / 2);
}

export class ExplorationPathPolishManager {
  private readonly refresh = new RefreshThrottle(120);
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this));
  }
  private update(): void {
    if (!this.refresh.shouldRun(this.game.loop.time)) return;
    for (const scene of this.game.scene.getScenes(true)) {
      const strokes = PATHS[scene.scene.key];
      if (!strokes || scene.children.getByName(PATH_POLISH_ANCHOR)) continue;
      scene.add.zone(-64, -64, 2, 2).setName(PATH_POLISH_ANCHOR).setVisible(false);
      for (const stroke of strokes) drawRoundedStroke(scene, stroke);
    }
  }
}

let manager: ExplorationPathPolishManager | null = null;
export function getExplorationPathPolishManager(game: Phaser.Game): ExplorationPathPolishManager {
  manager ??= new ExplorationPathPolishManager(game);
  return manager;
}
