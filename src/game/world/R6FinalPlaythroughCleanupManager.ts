import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS,
  CORRECTED_MEADOW_PATH_NAME,
  LEGACY_GATEWAY_LABEL_TARGETS,
  type LegacyGatewayLabelTarget,
} from './R6FinalPlaythroughCleanup';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';

const CLEANUP_PREFIX = 'r6-wp6.18g';
const LEGACY_MEADOW_PATH_NAME = 'r6-region-gateway-art:meadow-crystal-brook:path';
const LEGACY_MEADOW_DIVIDER_NAME = 'r6-region-gateway-art:meadow-crystal-brook:divider';

function drawCorrectedMeadowPath(scene: Phaser.Scene): void {
  if (scene.children.getByName(CORRECTED_MEADOW_PATH_NAME)) {
    return;
  }

  const firstPoint = CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS[0];
  if (!firstPoint) {
    return;
  }

  const path = scene.add.graphics().setName(CORRECTED_MEADOW_PATH_NAME).setDepth(16.25);
  const draw = (width: number, colour: number, alpha: number): void => {
    path.lineStyle(width, colour, alpha);
    path.beginPath();
    path.moveTo(firstPoint.x, firstPoint.y);
    for (const point of CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS.slice(1)) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();
    path.fillStyle(colour, alpha);
    for (const point of CORRECTED_MEADOW_CRYSTAL_BROOK_PATH_POINTS) {
      path.fillCircle(point.x, point.y, width / 2);
    }
  };

  draw(112, 0xa98d68, 0.94);
  draw(84, 0xe6cfa1, 0.98);
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

function cleanLegacyGatewayLabel(scene: Phaser.Scene, target: LegacyGatewayLabelTarget): void {
  for (const object of scene.children.list) {
    if (!(object instanceof Phaser.GameObjects.Container)) {
      continue;
    }
    if (Math.abs(object.x - target.position.x) > 1 || Math.abs(object.y - target.position.y) > 1) {
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
