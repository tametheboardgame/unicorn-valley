import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from './PointerTouchInputAdapter';

export function shouldShowTouchMovementPad(
  maxTouchPoints: number,
  hasTouchStart: boolean,
): boolean {
  return maxTouchPoints > 0 || hasTouchStart;
}

export class TouchMovementPad {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  public constructor(scene: Phaser.Scene, input: PointerTouchInputAdapter) {
    const originX = 118;
    const originY = GAME_HEIGHT - 118;
    const spacing = 62;

    this.createButton(scene, input, originX, originY - spacing, '▲', 'MOVE_Y', -1);
    this.createButton(scene, input, originX, originY + spacing, '▼', 'MOVE_Y', 1);
    this.createButton(scene, input, originX - spacing, originY, '◀', 'MOVE_X', -1);
    this.createButton(scene, input, originX + spacing, originY, '▶', 'MOVE_X', 1);
  }

  public destroy(): void {
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
  }

  private createButton(
    scene: Phaser.Scene,
    input: PointerTouchInputAdapter,
    x: number,
    y: number,
    label: string,
    axis: 'MOVE_X' | 'MOVE_Y',
    value: number,
  ): void {
    const button = scene.add
      .circle(x, y, 29, 0xfffbef, 0.72)
      .setStrokeStyle(4, 0x9d72ad, 0.85)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = scene.add
      .text(x, y, label, {
        color: '#5c4568',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);

    const press = (): void => input.setAxis(axis, value);
    const release = (): void => input.setAxis(axis, 0);
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.objects.push(button, text);
  }
}
