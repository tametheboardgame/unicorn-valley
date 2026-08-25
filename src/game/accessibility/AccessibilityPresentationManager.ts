import Phaser from 'phaser';
import {
  getBrowserAccessibilitySettingsStore,
  type AccessibilitySettings,
} from './AccessibilitySettings';

function isReducedMotionTarget(object: Phaser.GameObjects.GameObject): boolean {
  const name = object.name ?? '';
  return (
    name.startsWith('core-npc:') ||
    name.endsWith(':ambient') ||
    (name.startsWith('environment-production:') && name.endsWith(':signature'))
  );
}

function flattenTargets(object: Phaser.GameObjects.GameObject): Phaser.GameObjects.GameObject[] {
  if (!(object instanceof Phaser.GameObjects.Container)) {
    return [object];
  }

  return [
    object,
    ...object.list.flatMap((child) =>
      child instanceof Phaser.GameObjects.Container ? flattenTargets(child) : [child],
    ),
  ];
}

export class AccessibilityPresentationManager {
  private readonly settingsStore = getBrowserAccessibilitySettingsStore();
  private reducedMotion = this.settingsStore.load().reducedMotion;
  private lastSweepAt = 0;

  public constructor(private readonly game: Phaser.Game) {
    this.settingsStore.subscribe((settings) => this.onSettingsChanged(settings));
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private onSettingsChanged(settings: AccessibilitySettings): void {
    this.reducedMotion = settings.reducedMotion;
    this.applyToActiveScenes();
  }

  private update(): void {
    if (!this.reducedMotion) {
      return;
    }

    const now = globalThis.performance?.now() ?? Date.now();
    if (now - this.lastSweepAt < 250) {
      return;
    }
    this.lastSweepAt = now;
    this.applyToActiveScenes();
  }

  private applyToActiveScenes(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      for (const object of scene.children.list) {
        if (!isReducedMotionTarget(object)) {
          continue;
        }

        for (const target of flattenTargets(object)) {
          for (const tween of scene.tweens.getTweensOf(target)) {
            if (this.reducedMotion) {
              tween.pause();
            } else {
              tween.resume();
            }
          }
        }
      }
    }
  }
}

let browserAccessibilityPresentationManager: AccessibilityPresentationManager | null = null;

export function getAccessibilityPresentationManager(
  game: Phaser.Game,
): AccessibilityPresentationManager {
  browserAccessibilityPresentationManager ??= new AccessibilityPresentationManager(game);
  return browserAccessibilityPresentationManager;
}
