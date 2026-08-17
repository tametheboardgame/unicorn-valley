export type PlayerFacing = 'up' | 'down' | 'left' | 'right';
export type PlayerMotionState = 'idle' | 'moving';

export interface PlayerMovementCommand {
  velocityX: number;
  velocityY: number;
  facing: PlayerFacing;
  motionState: PlayerMotionState;
}

export const DEFAULT_PLAYER_SPEED = 300;

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function chooseFacing(x: number, y: number, previousFacing: PlayerFacing): PlayerFacing {
  const absoluteX = Math.abs(x);
  const absoluteY = Math.abs(y);

  if (absoluteX === 0 && absoluteY === 0) {
    return previousFacing;
  }

  if (absoluteX > absoluteY) {
    return x < 0 ? 'left' : 'right';
  }

  return y < 0 ? 'up' : 'down';
}

export function resolvePlayerMovement(
  moveX: number,
  moveY: number,
  speed = DEFAULT_PLAYER_SPEED,
  previousFacing: PlayerFacing = 'down',
): PlayerMovementCommand {
  const x = clampAxis(moveX);
  const y = clampAxis(moveY);
  const magnitude = Math.hypot(x, y);

  if (magnitude === 0) {
    return {
      velocityX: 0,
      velocityY: 0,
      facing: previousFacing,
      motionState: 'idle',
    };
  }

  const normalisation = magnitude > 1 ? 1 / magnitude : 1;

  return {
    velocityX: x * normalisation * speed,
    velocityY: y * normalisation * speed,
    facing: chooseFacing(x, y, previousFacing),
    motionState: 'moving',
  };
}
