import Phaser from 'phaser';
import type { InputAdapter } from './InputAdapter';
import { BUTTON_INPUT_ACTIONS, type AxisInputAction, type ButtonInputAction } from './InputAction';
import { resolvePressedButtonActions } from './KeyboardButtonPress';
import { SceneTransitionMovementGate } from './SceneTransitionMovementGate';

interface AxisBinding {
  negative: readonly Phaser.Input.Keyboard.Key[];
  positive: readonly Phaser.Input.Keyboard.Key[];
}

export class KeyboardInputAdapter implements InputAdapter {
  private readonly buttons: Record<ButtonInputAction, readonly Phaser.Input.Keyboard.Key[]>;
  private readonly axes: Record<AxisInputAction, AxisBinding>;
  private readonly pressedThisFrame = new Set<ButtonInputAction>();
  private readonly movementGate = new SceneTransitionMovementGate();

  public constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable for this scene.');
    }

    const key = (keyCode: number, enableCapture = false): Phaser.Input.Keyboard.Key =>
      keyboard.addKey(keyCode, enableCapture);
    const left = key(Phaser.Input.Keyboard.KeyCodes.LEFT, true);
    const right = key(Phaser.Input.Keyboard.KeyCodes.RIGHT, true);
    const up = key(Phaser.Input.Keyboard.KeyCodes.UP, true);
    const down = key(Phaser.Input.Keyboard.KeyCodes.DOWN, true);
    const a = key(Phaser.Input.Keyboard.KeyCodes.A);
    const d = key(Phaser.Input.Keyboard.KeyCodes.D);
    const w = key(Phaser.Input.Keyboard.KeyCodes.W);
    const s = key(Phaser.Input.Keyboard.KeyCodes.S);
    const space = key(Phaser.Input.Keyboard.KeyCodes.SPACE, true);
    const enter = key(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const e = key(Phaser.Input.Keyboard.KeyCodes.E);
    const escapeKey = key(Phaser.Input.Keyboard.KeyCodes.ESC);
    const wonderbook = key(Phaser.Input.Keyboard.KeyCodes.B);
    const inventory = key(Phaser.Input.Keyboard.KeyCodes.I);

    this.buttons = {
      INTERACT: [space, enter, e],
      BACK: [escapeKey],
      OPEN_WONDERBOOK: [wonderbook],
      OPEN_INVENTORY: [inventory],
      RACE_JUMP: [space],
    };

    this.axes = {
      MOVE_X: { negative: [left, a], positive: [right, d] },
      MOVE_Y: { negative: [up, w], positive: [down, s] },
      RACE_MOVE_Y: { negative: [up, w], positive: [down, s] },
    };
  }

  public update(): void {
    this.pressedThisFrame.clear();

    const uniqueKeys = new Set<Phaser.Input.Keyboard.Key>();
    for (const action of BUTTON_INPUT_ACTIONS) {
      for (const key of this.buttons[action]) {
        uniqueKeys.add(key);
      }
    }

    const pressedKeys = new Set<Phaser.Input.Keyboard.Key>();
    for (const key of uniqueKeys) {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        pressedKeys.add(key);
      }
    }

    const pressedActions = resolvePressedButtonActions(this.buttons, pressedKeys);
    for (const action of pressedActions) {
      this.pressedThisFrame.add(action);
    }

    const movementKeys = new Set<Phaser.Input.Keyboard.Key>();
    for (const binding of Object.values(this.axes)) {
      for (const key of [...binding.negative, ...binding.positive]) {
        movementKeys.add(key);
      }
    }
    this.movementGate.update([...movementKeys].some((key) => key.isDown));
  }

  public getAxis(action: AxisInputAction): number {
    const binding = this.axes[action];
    const negative = binding.negative.some((key) => key.isDown) ? -1 : 0;
    const positive = binding.positive.some((key) => key.isDown) ? 1 : 0;
    return this.movementGate.filter(negative + positive);
  }

  public isDown(action: ButtonInputAction): boolean {
    return this.buttons[action].some((key) => key.isDown);
  }

  public justPressed(action: ButtonInputAction): boolean {
    return this.pressedThisFrame.has(action);
  }

  public destroy(): void {
    this.pressedThisFrame.clear();
  }
}
