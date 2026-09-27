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
  private targetSnapshot: readonly InteractionTarget[] | null = null;

  public replaceOwnerTargets(ownerId: string, targets: readonly InteractionTarget[]): void {
    if (targets.length === 0) {
      this.targetsByOwner.delete(ownerId);
      return;
    }
    this.targetsByOwner.set(ownerId, targets);
    this.targetSnapshot = null;
  }

  public clearOwner(ownerId: string): void {
    if (this.targetsByOwner.delete(ownerId)) {
      this.targetSnapshot = null;
    }
  }

  public getTargets(): InteractionTarget[] {
    return [...this.getTargetSnapshot()];
  }

  public getTargetSnapshot(): readonly InteractionTarget[] {
    if (this.targetSnapshot) {
      return this.targetSnapshot;
    }

    const targets: InteractionTarget[] = [];
    this.forEachTarget((target) => targets.push(target));
    this.targetSnapshot = targets;
    return targets;
  }

  public forEachTarget(visitor: (target: InteractionTarget) => void): void {
    for (const ownerTargets of this.targetsByOwner.values()) {
      for (const target of ownerTargets) {
        visitor(target);
      }
    }
  }

  public clear(): void {
    if (this.targetsByOwner.size === 0) {
      return;
    }
    this.targetsByOwner.clear();
    this.targetSnapshot = null;
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
