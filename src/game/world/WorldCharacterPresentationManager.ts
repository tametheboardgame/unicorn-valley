import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';

export const RAINBOW_MEADOW_NOVA_SCALE = 0.65;
export const RAINBOW_MEADOW_NOVA_LABEL_OFFSET_Y = 58;

export class WorldCharacterPresentationManager {
  private readonly adjustedObjects = new WeakSet<Phaser.GameObjects.GameObject>();
  private readonly syncThrottle = new RefreshThrottle(100);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    const scene = this.game.scene.getScene('RainbowMeadowScene');
    if (!scene?.scene.isActive()) {
      return;
    }

    const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((item) => item.id === 'nova');
    if (!marker) {
      return;
    }

    const nova = scene.children.list.find(
      (object): object is Phaser.GameObjects.Container =>
        object instanceof Phaser.GameObjects.Container &&
        Math.abs(object.x - marker.position.x) <= 1 &&
        Math.abs(object.y - marker.position.y) <= 12 &&
        object.list.length >= 7,
    );

    if (nova && !this.adjustedObjects.has(nova)) {
      nova.setScale(RAINBOW_MEADOW_NOVA_SCALE);
      this.adjustedObjects.add(nova);
    }

    const label = scene.children.list.find(
      (object): object is Phaser.GameObjects.Text =>
        object instanceof Phaser.GameObjects.Text &&
        object.text === 'Nova' &&
        Math.abs(object.x - marker.position.x) <= 1,
    );
    if (label && !this.adjustedObjects.has(label)) {
      label.setY(marker.position.y + RAINBOW_MEADOW_NOVA_LABEL_OFFSET_Y);
      this.adjustedObjects.add(label);
    }
  }
}

let browserWorldCharacterPresentationManager: WorldCharacterPresentationManager | null = null;

export function getWorldCharacterPresentationManager(
  game: Phaser.Game,
): WorldCharacterPresentationManager {
  browserWorldCharacterPresentationManager ??= new WorldCharacterPresentationManager(game);
  return browserWorldCharacterPresentationManager;
}
