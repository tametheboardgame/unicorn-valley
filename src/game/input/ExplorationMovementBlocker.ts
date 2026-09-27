import Phaser from 'phaser';
import { isInteractionModalActive } from '../interaction/InteractionModalState';

const BLOCKING_OBJECT_NAMES = new Set(['exploration-controls-panel']);

export function isBlockingExplorationObject(
  name: string,
  active: boolean,
  visible: boolean,
): boolean {
  return active && visible && BLOCKING_OBJECT_NAMES.has(name);
}

export function isExplorationMovementBlocked(scene: Phaser.Scene): boolean {
  if (isInteractionModalActive(scene)) {
    return true;
  }

  const dialoguePanel = scene.children.getByName('dialogue-production-panel');
  if (
    dialoguePanel?.active &&
    (dialoguePanel as Phaser.GameObjects.GameObject & { visible?: boolean }).visible === true
  ) {
    return true;
  }

  return scene.children.list.some((object) => {
    const displayObject = object as Phaser.GameObjects.GameObject & { visible?: boolean };
    return isBlockingExplorationObject(
      displayObject.name,
      displayObject.active,
      displayObject.visible === true,
    );
  });
}
