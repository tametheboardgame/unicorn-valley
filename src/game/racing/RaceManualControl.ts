export function updateRaceKeyboardArmed(
  currentlyArmed: boolean,
  rightDown: boolean,
  dDown: boolean,
): boolean {
  if (currentlyArmed) {
    return true;
  }
  return !rightDown && !dDown;
}

export function resolveRaceRunning(
  keyboardArmed: boolean,
  rightDown: boolean,
  dDown: boolean,
  touchRunning: boolean,
): boolean {
  return touchRunning || (keyboardArmed && (rightDown || dDown));
}
