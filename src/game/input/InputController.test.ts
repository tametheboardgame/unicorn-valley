import { describe, expect, it } from 'vitest';
import type { InputAdapter } from './InputAdapter';
import type { AxisInputAction, ButtonInputAction } from './InputAction';
import { InputController } from './InputController';

class FakeInputAdapter implements InputAdapter {
  public axis = 0;
  public down = false;
  public pressed = false;

  public update(): void {}

  public getAxis(_action: AxisInputAction): number {
    return this.axis;
  }

  public isDown(_action: ButtonInputAction): boolean {
    return this.down;
  }

  public justPressed(_action: ButtonInputAction): boolean {
    return this.pressed;
  }

  public destroy(): void {}
}

describe('InputController', () => {
  it('combines adapters and clamps axes to the logical action range', () => {
    const keyboard = new FakeInputAdapter();
    const touch = new FakeInputAdapter();
    keyboard.axis = 0.8;
    touch.axis = 0.7;
    const input = new InputController([keyboard, touch]);

    expect(input.getAxis('MOVE_X')).toBe(1);
  });

  it('exposes named button actions without depending on raw keys', () => {
    const adapter = new FakeInputAdapter();
    adapter.down = true;
    adapter.pressed = true;
    const input = new InputController([adapter]);

    expect(input.isDown('INTERACT')).toBe(true);
    expect(input.justPressed('INTERACT')).toBe(true);
  });
});
