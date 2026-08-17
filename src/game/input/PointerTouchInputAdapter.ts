import type { InputAdapter } from './InputAdapter';
import type { AxisInputAction, ButtonInputAction } from './InputAction';

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class PointerTouchInputAdapter implements InputAdapter {
  private readonly axes = new Map<AxisInputAction, number>();
  private readonly down = new Set<ButtonInputAction>();
  private readonly pendingPressed = new Set<ButtonInputAction>();
  private readonly pressedThisFrame = new Set<ButtonInputAction>();

  public setAxis(action: AxisInputAction, value: number): void {
    this.axes.set(action, clampAxis(value));
  }

  public setButton(action: ButtonInputAction, isDown: boolean): void {
    const wasDown = this.down.has(action);

    if (isDown) {
      this.down.add(action);
      if (!wasDown) {
        this.pendingPressed.add(action);
      }
      return;
    }

    this.down.delete(action);
  }

  public update(): void {
    this.pressedThisFrame.clear();
    for (const action of this.pendingPressed) {
      this.pressedThisFrame.add(action);
    }
    this.pendingPressed.clear();
  }

  public getAxis(action: AxisInputAction): number {
    return this.axes.get(action) ?? 0;
  }

  public isDown(action: ButtonInputAction): boolean {
    return this.down.has(action);
  }

  public justPressed(action: ButtonInputAction): boolean {
    return this.pressedThisFrame.has(action);
  }

  public destroy(): void {
    this.axes.clear();
    this.down.clear();
    this.pendingPressed.clear();
    this.pressedThisFrame.clear();
  }
}
