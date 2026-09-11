import Phaser from 'phaser';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { ensureExplorationHudOverlayScene } from './ExplorationHudOverlayScene';
import { ExplorationShell } from './ExplorationShell';
import { supportsExplorationShell } from './ExplorationShellConfig';

interface SceneWithPointerInput {
  pointerInput?: PointerTouchInputAdapter | null;
}

export class ExplorationShellWorldManager {
  private readonly fallbackPointerInputs = new WeakMap<Phaser.Scene, PointerTouchInputAdapter>();
  private readonly syncThrottle = new RefreshThrottle(100);

  public constructor(private readonly game: Phaser.Game) {
    ensureExplorationHudOverlayScene(game);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    let hasActiveExplorationScene = false;
    for (const scene of this.game.scene.getScenes(true)) {
      if (!supportsExplorationShell(scene.scene.key)) {
        continue;
      }

      hasActiveExplorationScene = true;
      ExplorationShell.ensure(scene, this.getPointerInput(scene));
    }

    // Some regions, notably Starlight Beach, are registered/started lazily after the persistent
    // HUD overlay scene already exists. Phaser renders later-started scenes above older scenes, so
    // without restoring scene order the world can cover the otherwise-correct HUD. Keep the
    // canonical exploration HUD topmost whenever an exploration world is active; the overlay
    // itself still hides while a modal scene is open.
    if (hasActiveExplorationScene && this.game.scene.isActive('ExplorationHudOverlayScene')) {
      this.game.scene.bringToTop('ExplorationHudOverlayScene');
    }
  }

  private getPointerInput(scene: Phaser.Scene): PointerTouchInputAdapter {
    const scenePointerInput = (scene as Phaser.Scene & SceneWithPointerInput).pointerInput;
    if (scenePointerInput) {
      return scenePointerInput;
    }

    const existing = this.fallbackPointerInputs.get(scene);
    if (existing) {
      return existing;
    }

    const pointerInput = new PointerTouchInputAdapter();
    this.fallbackPointerInputs.set(scene, pointerInput);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.fallbackPointerInputs.delete(scene);
    });
    return pointerInput;
  }
}

let manager: ExplorationShellWorldManager | null = null;

export function getExplorationShellWorldManager(game: Phaser.Game): ExplorationShellWorldManager {
  manager ??= new ExplorationShellWorldManager(game);
  return manager;
}
