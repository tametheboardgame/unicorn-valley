import type { PlayerFacing } from '../player/PlayerMovement';

export function parsePlayerFacing(value: unknown, fallback: PlayerFacing = 'down'): PlayerFacing {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right'
    ? value
    : fallback;
}

export function resolveClickNavigationFacing(
  directionX: number,
  directionY: number,
  previousFacing: PlayerFacing,
): PlayerFacing {
  const absoluteX = Math.abs(directionX);
  const absoluteY = Math.abs(directionY);
  if (absoluteX <= 2 && absoluteY <= 2) {
    return previousFacing;
  }
  if (absoluteX >= absoluteY) {
    return directionX < 0 ? 'left' : 'right';
  }
  return directionY < 0 ? 'up' : 'down';
}
