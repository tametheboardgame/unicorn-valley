import Phaser from 'phaser';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { ExplorationShell } from './ExplorationShell';
import { supportsExplorationShell } from './ExplorationShellConfig';

export class ExplorationShellWorldManager {
  private readonly fallbackPointerInputs = new WeakMap<Phaser.Scene, PointerTouchInputAdapter>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!supportsExplorationShell(scene.scene.key)) {
        continue;
      }

      ExplorationShell.ensure(scene, this.getFallbackPointerInput(scene));
    }
  }

  private getFallbackPointerInput(scene: Phaser.Scene): PointerTouchInputAdapter {
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
