import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { CRYSTAL_BROOK_MAP } from './CrystalBrookMap';

const PREFIX = 'final-graphics-tightening';
const R6_GATEWAY_ANCHOR = 'r6-region-gateway-art-anchor';

interface BackdropCircleDefinition {
  x: number;
  y: number;
  diameter: number;
  alpha: number;
}

interface VisibilityObject {
  setVisible(visible: boolean): unknown;
}

const CRYSTAL_BROOK_BACKDROPS: readonly BackdropCircleDefinition[] = [
  { x: 760, y: 510, diameter: 1220, alpha: 0.16 },
  { x: 1950, y: 1560, diameter: 1460, alpha: 0.13 },
  { x: 3050, y: 740, diameter: 1300, alpha: 0.15 },
];

const WHISPERING_WOODS_BACKDROPS: readonly BackdropCircleDefinition[] = [
  { x: 760, y: 610, diameter: 1420, alpha: 0.15 },
  { x: 1900, y: 1540, diameter: 1520, alpha: 0.13 },
  { x: 2860, y: 790, diameter: 1320, alpha: 0.15 },
];

function approximately(value: number, expected: number, tolerance = 2): boolean {
  return Math.abs(value - expected) <= tolerance;
}

function setNamedObjectVisible(scene: Phaser.Scene, objectName: string, visible: boolean): void {
  const object = scene.children.getByName(objectName);
  if (!object || !('setVisible' in object)) {
    return;
  }
  (object as Phaser.GameObjects.GameObject & VisibilityObject).setVisible(visible);
}

function softenBackdropCircles(
  scene: Phaser.Scene,
  definitions: readonly BackdropCircleDefinition[],
): void {
  for (const definition of definitions) {
    const circle = scene.children.list.find(
      (object): object is Phaser.GameObjects.Arc =>
        object instanceof Phaser.GameObjects.Arc &&
        approximately(object.x, definition.x) &&
        approximately(object.y, definition.y) &&
        approximately(object.displayWidth, definition.diameter, 4) &&
        approximately(object.displayHeight, definition.diameter, 4) &&
        approximately(object.depth, 1, 0.01),
    );
    circle?.setAlpha(definition.alpha);
  }
}

function drawRoundedStroke(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  colour: number,
  alpha: number,
): void {
  const points = CRYSTAL_BROOK_MAP.shallowStream.points;
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

function replaceCrystalBrookStream(scene: Phaser.Scene): void {
  const replacementName = `${PREFIX}:crystal-brook-stream`;
  if (scene.children.getByName(replacementName)) {
    return;
  }

  const legacyStream = scene.children.list.find(
    (object): object is Phaser.GameObjects.Graphics =>
      object instanceof Phaser.GameObjects.Graphics &&
      object.name.length === 0 &&
      approximately(object.depth, 3, 0.01),
  );
  legacyStream?.setVisible(false);

  const stream = scene.add.graphics().setName(replacementName).setDepth(3.05);
  drawRoundedStroke(stream, CRYSTAL_BROOK_MAP.shallowStream.width + 10, 0x55b8c8, 0.42);
  drawRoundedStroke(stream, CRYSTAL_BROOK_MAP.shallowStream.width - 8, 0x63c8d5, 0.9);
  drawRoundedStroke(stream, 48, 0xa8e9e5, 0.5);
}

function tightenCrystalBrook(scene: Phaser.Scene): void {
  softenBackdropCircles(scene, CRYSTAL_BROOK_BACKDROPS);
  replaceCrystalBrookStream(scene);
  if (!scene.children.getByName(`${PREFIX}:crystal-brook-anchor`)) {
    scene.add.zone(-64, -64, 2, 2).setName(`${PREFIX}:crystal-brook-anchor`).setVisible(false);
  }
}

function tightenWhisperingWoods(scene: Phaser.Scene): void {
  softenBackdropCircles(scene, WHISPERING_WOODS_BACKDROPS);

  // R6 added a second short entry path even though the canonical Woods route already reaches
  // the Brook threshold. Its endpoint sits above the real route, producing an orphaned path nub.
  setNamedObjectVisible(scene, 'r6-region-gateway-art:woods-entry-trail:path', false);

  // The environment-production pass already owns the soft woodland light shafts. Keeping the
  // second R6 set makes large translucent triangles stack over one another, especially at night.
  setNamedObjectVisible(scene, 'r6-region-gateway-art:whispering-woods:light-shafts', false);

  if (
    scene.children.getByName(R6_GATEWAY_ANCHOR) &&
    !scene.children.getByName(`${PREFIX}:whispering-woods-anchor`)
  ) {
    scene.add.zone(-64, -64, 2, 2).setName(`${PREFIX}:whispering-woods-anchor`).setVisible(false);
  }
}

export class FinalGraphicsTighteningManager {
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
      if (scene.scene.key === 'CrystalBrookScene') {
        tightenCrystalBrook(scene);
      } else if (scene.scene.key === 'WhisperingWoodsScene') {
        tightenWhisperingWoods(scene);
      }
    }
  }
}

let manager: FinalGraphicsTighteningManager | null = null;

export function getFinalGraphicsTighteningManager(
  game: Phaser.Game,
): FinalGraphicsTighteningManager {
  manager ??= new FinalGraphicsTighteningManager(game);
  return manager;
}
