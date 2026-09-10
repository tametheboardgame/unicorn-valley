import type Phaser from 'phaser';

const lockedScenes = new WeakSet<Phaser.Scene>();
let lockCount = 0;

/**
 * Shared gameplay lock for an active conversation/interaction surface.
 * It suppresses exploration movement and contextual background interaction without pausing the scene,
 * so the active surface can still receive close/continue input.
 */
export function setInteractionModalActive(scene: Phaser.Scene, active: boolean): void {
  const wasActive = lockedScenes.has(scene);
  if (active === wasActive) {
    return;
  }

  if (active) {
    lockedScenes.add(scene);
    lockCount += 1;
    return;
  }

  lockedScenes.delete(scene);
  lockCount = Math.max(0, lockCount - 1);
}

export function isInteractionModalActive(scene?: Phaser.Scene): boolean {
  return scene ? lockedScenes.has(scene) : lockCount > 0;
}
