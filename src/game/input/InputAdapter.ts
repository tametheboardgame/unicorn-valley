import type { AxisInputAction, ButtonInputAction } from './InputAction';

export interface InputAdapter {
  update(): void;
  getAxis(action: AxisInputAction): number;
  isDown(action: ButtonInputAction): boolean;
  justPressed(action: ButtonInputAction): boolean;
  destroy(): void;
}
