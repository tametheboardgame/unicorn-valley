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
  return scene.children.list.some((object) => {
    const displayObject = object as Phaser.GameObjects.GameObject & { visible?: boolean };
    return isBlockingExplorationObject(
      displayObject.name,
      displayObject.active,
      displayObject.visible === true,
    );
  });
}
