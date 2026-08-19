import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from './PointerTouchInputAdapter';

let preferredTouchControlsVisible: boolean | null = null;
const padsByScene = new WeakMap<Phaser.Scene, TouchMovementPad>();

export function shouldShowTouchMovementPad(
  maxTouchPoints: number,
  hasTouchStart: boolean,
): boolean {
  return preferredTouchControlsVisible === true || maxTouchPoints > 0 || hasTouchStart;
}

function shouldDefaultTouchMovementPadVisible(): boolean {
  const touchCapable = shouldShowTouchMovementPad(
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
  );
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(pointer: coarse)').matches;
  const compactViewport = typeof globalThis.innerWidth === 'number' && globalThis.innerWidth <= 900;
  return touchCapable && (coarsePointer || compactViewport);
}

export class TouchMovementPad {
  private readonly objects: Array<Phaser.GameObjects.Arc | Phaser.GameObjects.Text> = [];
  private readonly buttons: Phaser.GameObjects.Arc[] = [];
  private visible = true;
  private destroyed = false;

  public static ensure(scene: Phaser.Scene, input: PointerTouchInputAdapter): TouchMovementPad {
    return padsByScene.get(scene) ?? new TouchMovementPad(scene, input);
  }

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly input: PointerTouchInputAdapter,
  ) {
    padsByScene.set(scene, this);

    const originX = 118;
    const originY = GAME_HEIGHT - 118;
    const spacing = 62;

    this.createButton(originX, originY - spacing, '▲', 'MOVE_Y', -1, 'up');
    this.createButton(originX, originY + spacing, '▼', 'MOVE_Y', 1, 'down');
    this.createButton(originX - spacing, originY, '◀', 'MOVE_X', -1, 'left');
    this.createButton(originX + spacing, originY, '▶', 'MOVE_X', 1, 'right');

    this.setVisible(
      preferredTouchControlsVisible ?? shouldDefaultTouchMovementPadVisible(),
      false,
    );
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public togglePreferredVisibility(): boolean {
    const nextVisible = !this.visible;
    this.setVisible(nextVisible, true);
    return nextVisible;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.input.setAxis('MOVE_X', 0);
    this.input.setAxis('MOVE_Y', 0);
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.buttons.length = 0;
    if (padsByScene.get(this.scene) === this) {
      padsByScene.delete(this.scene);
    }
  }

  private setVisible(visible: boolean, remember: boolean): void {
    this.visible = visible;
    if (remember) {
      preferredTouchControlsVisible = visible;
    }

    if (!visible) {
      this.input.setAxis('MOVE_X', 0);
      this.input.setAxis('MOVE_Y', 0);
    }

    for (const object of this.objects) {
      object.setVisible(visible);
    }
    for (const button of this.buttons) {
      if (visible) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    axis: 'MOVE_X' | 'MOVE_Y',
    value: number,
    direction: 'up' | 'down' | 'left' | 'right',
  ): void {
    const button = this.scene.add
      .circle(x, y, 29, 0xfffbef, 0.72)
      .setName(`touch-movement-${direction}`)
      .setStrokeStyle(4, 0x9d72ad, 0.85)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        color: '#5c4568',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setName(`touch-movement-${direction}-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);

    const press = (): void => this.input.setAxis(axis, value);
    const release = (): void => this.input.setAxis(axis, 0);
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(button, text);
  }
}
