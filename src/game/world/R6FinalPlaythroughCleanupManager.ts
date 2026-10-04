import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  LEGACY_GATEWAY_LABEL_TARGETS,
  type LegacyGatewayLabelTarget,
} from './R6FinalPlaythroughCleanup';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';

const CLEANUP_PREFIX = 'r6-wp6.18g';

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
