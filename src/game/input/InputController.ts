import type { InputAdapter } from './InputAdapter';
import type { AxisInputAction, ButtonInputAction } from './InputAction';

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class InputController {
  public constructor(private readonly adapters: readonly InputAdapter[]) {}

  public update(): void {
    for (const adapter of this.adapters) {
      adapter.update();
    }
  }

  public getAxis(action: AxisInputAction): number {
    return clampAxis(this.adapters.reduce((total, adapter) => total + adapter.getAxis(action), 0));
  }

  public isDown(action: ButtonInputAction): boolean {
    return this.adapters.some((adapter) => adapter.isDown(action));
  }

  public justPressed(action: ButtonInputAction): boolean {
    return this.adapters.some((adapter) => adapter.justPressed(action));
  }

  public destroy(): void {
    for (const adapter of this.adapters) {
      adapter.destroy();
    }
  }
}
