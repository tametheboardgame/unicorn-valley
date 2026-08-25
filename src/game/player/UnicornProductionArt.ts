import type { PlayerMotionState } from './PlayerMovement';

export const UNICORN_PRODUCTION_POSES = [
  'idle',
  'walk-a',
  'walk-b',
  'gallop-a',
  'gallop-b',
  'celebrate',
] as const;

export type UnicornProductionPose = (typeof UNICORN_PRODUCTION_POSES)[number];

export function getUnicornProductionTextureKey(
  baseTextureKey: string,
  pose: UnicornProductionPose,
): string {
  return pose === 'idle' ? baseTextureKey : `${baseTextureKey}--${pose}`;
}

export function selectUnicornProductionPose(
  motionState: PlayerMotionState,
  speed: number,
  elapsedMs: number,
  galloping: boolean,
): UnicornProductionPose {
  if (motionState !== 'moving' && speed <= 24) {
    return 'idle';
  }

  if (galloping || speed >= 250) {
    return Math.floor(elapsedMs / 105) % 2 === 0 ? 'gallop-a' : 'gallop-b';
  }

  return Math.floor(elapsedMs / 165) % 2 === 0 ? 'walk-a' : 'walk-b';
}
