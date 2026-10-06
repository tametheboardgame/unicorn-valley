export type RainbowDiscPracticeDrill = 'menu' | 'target-range' | 'passing-drill' | 'rainbow-streak';

export const RAINBOW_DISC_TARGET_RANGE_THROWS = 5;
export const RAINBOW_DISC_PASSING_DRILL_ROUNDS = 6;
export const RAINBOW_DISC_STREAK_THROWS = 8;

const RAINBOW_DISC_STREAK_TARGET_PATTERN = [1, 0, 2, 1, 2, 0, 2, 1] as const;

export function rainbowDiscStreakTarget(attempt: number): number {
  const index = Math.abs(Math.trunc(attempt)) % RAINBOW_DISC_STREAK_TARGET_PATTERN.length;
  return RAINBOW_DISC_STREAK_TARGET_PATTERN[index] ?? 1;
}

export function rainbowDiscStreakTiming(attempt: number): {
  tolerance: number;
  sweepSpeed: number;
  label: string;
} {
  const step = Math.max(0, Math.min(RAINBOW_DISC_STREAK_THROWS - 1, Math.trunc(attempt)));
  return {
    tolerance: Math.max(0.12, 0.25 - step * 0.018),
    sweepSpeed: 0.0038 + step * 0.00034,
    label: `Streak ${step + 1}`,
  };
}

export type RainbowDiscStreakAttemptResult = 'hit' | 'wrong-target' | 'miss';

export function resolveRainbowDiscStreakAttempt(
  attempt: number,
  receiverIndex: number,
  accurate: boolean,
): RainbowDiscStreakAttemptResult {
  if (receiverIndex !== rainbowDiscStreakTarget(attempt)) {
    return 'wrong-target';
  }
  return accurate ? 'hit' : 'miss';
}
