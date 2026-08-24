import Phaser from 'phaser';

const BLOCKING_OBJECT_NAMES = new Set(['exploration-controls-panel']);

export function isBlockingExplorationObject(
  name: string,
  active: boolean,
  visible: boolean,
): boolean {
  return active && visible && BLOCKING_OBJECT_NAMES.has(name);
}

export function isExplorationMovementBlocked(scene: Phaser.Scene): boolean {
  return scene.children.list.some((object) =>
    isBlockingExplorationObject(object.name, object.active, object.visible),
  );
}
