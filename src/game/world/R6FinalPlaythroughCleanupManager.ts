import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS,
  CORRECTED_MEADOW_PATH_NAME,
  LEGACY_GATEWAY_LABEL_TARGETS,
  type LegacyGatewayLabelTarget,
} from './R6FinalPlaythroughCleanup';
import { INTERACTIVE_GATEWAY_RADIUS } from './RegionGatewayRules';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

const CLEANUP_PREFIX = 'r6-wp6.18g';
const FINAL_FIX_PREFIX = 'r6-wp6.18ij';
const LEGACY_MEADOW_PATH_NAME = 'r6-region-gateway-art:meadow-crystal-brook:path';
const LEGACY_MEADOW_DIVIDER_NAME = 'r6-region-gateway-art:meadow-crystal-brook:divider';
const LEGACY_BROOK_WOODS_PATH_NAME = 'r6-region-gateway-art:brook-woods:path';
const LEGACY_CRYSTAL_CASCADE_PATH_NAME = 'r6-region-gateway-art:crystal-cascade:path';
const BROOK_WOODS_PATH_NAME = `${FINAL_FIX_PREFIX}:brook-woods:path`;
const CRYSTAL_CASCADE_PATH_NAME = `${FINAL_FIX_PREFIX}:crystal-cascade:path`;
const CRYSTAL_CASCADE_TAP_TARGET_NAME = `${FINAL_FIX_PREFIX}:crystal-cascade-tap-target`;
const CRYSTAL_CASCADE_GATE_POSITION = { x: 2860, y: 850 } as const;

interface PathPoint {
  x: number;
  y: number;
}

const BROOK_WOODS_PATH_POINTS: readonly PathPoint[] = [
  { x: 2580, y: 1200 },
  { x: 2810, y: 1110 },
  { x: 3050, y: 1030 },
  { x: 3260, y: 990 },
] as const;

const CRYSTAL_CASCADE_PATH_POINTS: readonly PathPoint[] = [
  { x: 2520, y: 1170 },
  { x: 2620, y: 1050 },
  { x: 2740, y: 940 },
  { x: 2860, y: 850 },
] as const;

function drawPath(
  scene: Phaser.Scene,
  name: string,
  points: readonly PathPoint[],
  depth: number,
  outerWidth: number,
  innerWidth: number,
  outerColour: number,
  innerColour: number,
  outerAlpha: number,
  innerAlpha: number,
): void {
  if (scene.children.getByName(name)) {
    return;
  }

  const firstPoint = points[0];
  if (!firstPoint) {
    return;
  }

  const path = scene.add.graphics().setName(name).setDepth(depth);
  const draw = (width: number, colour: number, alpha: number): void => {
    path.lineStyle(width, colour, alpha);
    path.beginPath();
    path.moveTo(firstPoint.x, firstPoint.y);
    for (const point of points.slice(1)) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();
    path.fillStyle(colour, alpha);
    for (const point of points) {
      path.fillCircle(point.x, point.y, width / 2);
    }
  };

  draw(outerWidth, outerColour, outerAlpha);
  draw(innerWidth, innerColour, innerAlpha);
}

function drawCorrectedMeadowPath(scene: Phaser.Scene): void {
  drawPath(
    scene,
    CORRECTED_MEADOW_PATH_NAME,
    CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS,
    2.05,
    138,
    90,
    0xe7cf99,
    0xf5e6bc,
    0.95,
    0.92,
  );
}

function cleanMeadowCrystalBrookPath(scene: Phaser.Scene): void {
  const legacyPath = scene.children.getByName(LEGACY_MEADOW_PATH_NAME);
  if (legacyPath instanceof Phaser.GameObjects.Graphics) {
    legacyPath.setVisible(false);
  }

  const legacyDivider = scene.children.getByName(LEGACY_MEADOW_DIVIDER_NAME);
  if (legacyDivider instanceof Phaser.GameObjects.Container) {
    legacyDivider.setVisible(false);
  }

  drawCorrectedMeadowPath(scene);
}

function cleanBrookGatewayPaths(scene: Phaser.Scene): void {
  for (const legacyName of [LEGACY_BROOK_WOODS_PATH_NAME, LEGACY_CRYSTAL_CASCADE_PATH_NAME]) {
    const legacyPath = scene.children.getByName(legacyName);
    if (legacyPath instanceof Phaser.GameObjects.Graphics) {
      legacyPath.setVisible(false);
    }
  }

  drawPath(
    scene,
    BROOK_WOODS_PATH_NAME,
    BROOK_WOODS_PATH_POINTS,
    2.05,
    128,
    72,
    0xe8d4a5,
    0xf4e8c5,
    0.9,
    0.92,
  );
  drawPath(
    scene,
    CRYSTAL_CASCADE_PATH_NAME,
    CRYSTAL_CASCADE_PATH_POINTS,
    2.05,
    128,
    72,
    0xe8d4a5,
    0xf4e8c5,
    0.9,
    0.92,
  );
}

function cleanPebblePresentation(scene: Phaser.Scene): void {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === 'pebble');
  if (!marker) {
    return;
  }

  for (const object of scene.children.list) {
    if (!(object instanceof Phaser.GameObjects.Container)) {
      continue;
    }
    if (
      object.name !== 'pebble-world-presentation' ||
      Math.abs(object.x - marker.position.x) > 1 ||
      Math.abs(object.y - marker.position.y) > 1
    ) {
      continue;
    }

    const isPebbleStoryPresentation = object.list.some(
      (child) => child instanceof Phaser.GameObjects.Text && child.text.startsWith('Talk: Pebble'),
    );
    if (!isPebbleStoryPresentation) {
      continue;
    }

    for (const child of object.list) {
      if (child instanceof Phaser.GameObjects.Arc) {
        child.setName(`${CLEANUP_PREFIX}:pebble-story-cover`).setVisible(false);
      } else if (child instanceof Phaser.GameObjects.Text && child.text === '🪨') {
        child.setName(`${CLEANUP_PREFIX}:pebble-story-icon`).setVisible(false);
      }
    }
  }
}

function findFunctionalGatewayZone(
  scene: Phaser.Scene,
  target: LegacyGatewayLabelTarget,
): Phaser.GameObjects.Zone | null {
  for (const object of scene.children.list) {
    if (!(object instanceof Phaser.GameObjects.Container)) {
      continue;
    }
    if (Math.abs(object.x - target.position.x) > 1 || Math.abs(object.y - target.position.y) > 1) {
      continue;
    }

    const hasMatchingLabel = object.list.some(
      (child) => child instanceof Phaser.GameObjects.Text && child.text === target.label,
    );
    if (!hasMatchingLabel) {
      continue;
    }

    const zone = object.list.find(
      (child): child is Phaser.GameObjects.Zone => child instanceof Phaser.GameObjects.Zone,
    );
    if (zone) {
      return zone;
    }
  }
  return null;
}

function ensureCrystalCascadeTapTarget(scene: Phaser.Scene): void {
  const existing = scene.children.getByName(CRYSTAL_CASCADE_TAP_TARGET_NAME);
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  if (!(player instanceof Phaser.GameObjects.Sprite)) {
    existing?.destroy();
    return;
  }

  const distance = Phaser.Math.Distance.Between(
    player.x,
    player.y,
    CRYSTAL_CASCADE_GATE_POSITION.x,
    CRYSTAL_CASCADE_GATE_POSITION.y,
  );
  if (distance > INTERACTIVE_GATEWAY_RADIUS) {
    existing?.destroy();
    return;
  }

  if (existing instanceof Phaser.GameObjects.Zone && existing.active) {
    return;
  }

  const target = LEGACY_GATEWAY_LABEL_TARGETS.find(
    (candidate) => candidate.id === 'crystal-brook-crystal-cascade',
  );
  if (!target) {
    return;
  }
  const functionalZone = findFunctionalGatewayZone(scene, target);
  if (!functionalZone) {
    return;
  }

  const tapTarget = scene.add
    .zone(CRYSTAL_CASCADE_GATE_POSITION.x, CRYSTAL_CASCADE_GATE_POSITION.y + 55, 360, 360)
    .setName(CRYSTAL_CASCADE_TAP_TARGET_NAME)
    .setDepth(220)
    .setInteractive({ useHandCursor: true });
  tapTarget.on('pointerdown', () => functionalZone.emit('pointerdown'));
}

function cleanLegacyGatewayLabel(scene: Phaser.Scene, target: LegacyGatewayLabelTarget): void {
  for (const object of scene.children.list) {
    if (!(object instanceof Phaser.GameObjects.Container)) {
      continue;
    }
    if (Math.abs(object.x - target.position.x) > 1 || Math.abs(object.y - target.position.y) > 1) {
      continue;
    }

    const isR5FunctionalGateway = object.list.some(
      (child) => child instanceof Phaser.GameObjects.Zone,
    );
    if (!isR5FunctionalGateway) {
      continue;
    }

    const legacyLabel = object.list.find(
      (child): child is Phaser.GameObjects.Text =>
        child instanceof Phaser.GameObjects.Text && child.text === target.label,
    );
    if (!legacyLabel) {
      continue;
    }

    legacyLabel.setName(`${CLEANUP_PREFIX}:legacy-gateway-label:${target.id}`).setVisible(false);
  }
}

export class R6FinalPlaythroughCleanupManager {
  private readonly refresh = new RefreshThrottle(80);

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
      if (scene.scene.key === 'SunbeamVillageScene') {
        cleanPebblePresentation(scene);
      } else if (scene.scene.key === 'RainbowMeadowScene') {
        cleanMeadowCrystalBrookPath(scene);
      } else if (scene.scene.key === 'CrystalBrookScene') {
        cleanBrookGatewayPaths(scene);
        ensureCrystalCascadeTapTarget(scene);
      }

      for (const target of LEGACY_GATEWAY_LABEL_TARGETS) {
        if (target.sceneKey === scene.scene.key) {
          cleanLegacyGatewayLabel(scene, target);
        }
      }
    }
  }
}

let manager: R6FinalPlaythroughCleanupManager | null = null;

export function getR6FinalPlaythroughCleanupManager(
  game: Phaser.Game,
): R6FinalPlaythroughCleanupManager {
  manager ??= new R6FinalPlaythroughCleanupManager(game);
  return manager;
}
