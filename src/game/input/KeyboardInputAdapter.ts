import Phaser from 'phaser';
import type { InputAdapter } from './InputAdapter';
import { BUTTON_INPUT_ACTIONS, type AxisInputAction, type ButtonInputAction } from './InputAction';
import { resolvePressedButtonActions } from './KeyboardButtonPress';

interface AxisBinding {
  negative: readonly Phaser.Input.Keyboard.Key[];
  positive: readonly Phaser.Input.Keyboard.Key[];
}

const EXPLORATION_MOVEMENT_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
]);
const heldExplorationMovementCodes = new Set<string>();
let movementTrackingInstalled = false;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const element = target as
    | {
        tagName?: string;
        isContentEditable?: boolean;
      }
    | null;
  const tagName = element?.tagName?.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element?.isContentEditable === true;
}

function ensureExplorationMovementTracking(): void {
  if (movementTrackingInstalled || typeof globalThis.addEventListener !== 'function') {
    return;
  }

  globalThis.addEventListener('keydown', (event: KeyboardEvent) => {
    if (
      EXPLORATION_MOVEMENT_CODES.has(event.code) &&
      !isEditableKeyboardTarget(event.target)
    ) {
      heldExplorationMovementCodes.add(event.code);
    }
  });
  globalThis.addEventListener('keyup', (event: KeyboardEvent) => {
    if (EXPLORATION_MOVEMENT_CODES.has(event.code)) {
      heldExplorationMovementCodes.delete(event.code);
    }
  });
  globalThis.addEventListener('blur', () => heldExplorationMovementCodes.clear());
  movementTrackingInstalled = true;
}

function trackedExplorationAxis(action: 'MOVE_X' | 'MOVE_Y'): number {
  ensureExplorationMovementTracking();

  const negativeCodes =
    action === 'MOVE_X' ? (['ArrowLeft', 'KeyA'] as const) : (['ArrowUp', 'KeyW'] as const);
  const positiveCodes =
    action === 'MOVE_X' ? (['ArrowRight', 'KeyD'] as const) : (['ArrowDown', 'KeyS'] as const);
  const negative = negativeCodes.some((code) => heldExplorationMovementCodes.has(code)) ? -1 : 0;
  const positive = positiveCodes.some((code) => heldExplorationMovementCodes.has(code)) ? 1 : 0;
  return negative + positive;
}

export function hasHeldExplorationMovementInput(): boolean {
  ensureExplorationMovementTracking();
  return heldExplorationMovementCodes.size > 0;
}

export class KeyboardInputAdapter implements InputAdapter {
  private readonly buttons: Record<ButtonInputAction, readonly Phaser.Input.Keyboard.Key[]>;
  private readonly axes: Record<AxisInputAction, AxisBinding>;
  private readonly pressedThisFrame = new Set<ButtonInputAction>();

  public constructor(scene: Phaser.Scene) {
    ensureExplorationMovementTracking();

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
  }

  public getAxis(action: AxisInputAction): number {
    if (action === 'MOVE_X' || action === 'MOVE_Y') {
      return trackedExplorationAxis(action);
    }

    const binding = this.axes[action];
    const negative = binding.negative.some((key) => key.isDown) ? -1 : 0;
    const positive = binding.positive.some((key) => key.isDown) ? 1 : 0;
    return negative + positive;
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
