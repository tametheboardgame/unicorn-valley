export const AXIS_INPUT_ACTIONS = ['MOVE_X', 'MOVE_Y', 'RACE_MOVE_Y'] as const;
export const BUTTON_INPUT_ACTIONS = [
  'INTERACT',
  'BACK',
  'OPEN_WONDERBOOK',
  'OPEN_INVENTORY',
  'RACE_JUMP',
] as const;

export type AxisInputAction = (typeof AXIS_INPUT_ACTIONS)[number];
export type ButtonInputAction = (typeof BUTTON_INPUT_ACTIONS)[number];
export type InputAction = AxisInputAction | ButtonInputAction;
