import type Phaser from 'phaser';
import type { InteractionTarget } from './InteractionTarget';

/**
 * Scene-scoped target registry used by every world-content provider.
 *
 * Managers publish targets here but never read input themselves. The active scene owns selection,
 * presentation and activation, which guarantees one contextual action and one activation route.
 */
export class SceneInteractionRegistry {
  private readonly targetsByOwner = new Map<string, readonly InteractionTarget[]>();

  public replaceOwnerTargets(ownerId: string, targets: readonly InteractionTarget[]): void {
    if (targets.length === 0) {
      this.targetsByOwner.delete(ownerId);
      return;
    }
    this.targetsByOwner.set(ownerId, targets);
  }

  public clearOwner(ownerId: string): void {
    this.targetsByOwner.delete(ownerId);
  }

  public getTargets(): InteractionTarget[] {
    const targets: InteractionTarget[] = [];
    for (const ownerTargets of this.targetsByOwner.values()) {
      targets.push(...ownerTargets);
    }
    return targets;
  }

  public clear(): void {
    this.targetsByOwner.clear();
  }
}

const registries = new WeakMap<Phaser.Scene, SceneInteractionRegistry>();

export function getSceneInteractionRegistry(scene: Phaser.Scene): SceneInteractionRegistry {
  let registry = registries.get(scene);
  if (registry) {
    return registry;
  }

  registry = new SceneInteractionRegistry();
  registries.set(scene, registry);
  scene.events.once('shutdown', () => registry?.clear());
  scene.events.once('destroy', () => registry?.clear());
  return registry;
}
