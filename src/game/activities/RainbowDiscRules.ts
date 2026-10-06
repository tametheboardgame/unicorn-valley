export type RainbowDiscAssistanceLevel = 'gentle' | 'standard' | 'challenge';

export interface RainbowDiscTimingProfile {
  tolerance: number;
  sweepSpeed: number;
  label: string;
}

export interface RainbowDiscAssistanceProfile {
  id: RainbowDiscAssistanceLevel;
  title: string;
  timingToleranceMultiplier: number;
  timingSpeedMultiplier: number;
  minimumPointerDrag: number;
}

export const RAINBOW_DISC_TIMING_CENTRE = 0.55;

export const RAINBOW_DISC_ASSISTANCE_PROFILES: Record<
  RainbowDiscAssistanceLevel,
  RainbowDiscAssistanceProfile
> = {
  gentle: {
    id: 'gentle',
    title: 'Gentle',
    timingToleranceMultiplier: 1.35,
    timingSpeedMultiplier: 0.8,
    minimumPointerDrag: 58,
  },
  standard: {
    id: 'standard',
    title: 'Standard',
    timingToleranceMultiplier: 1,
    timingSpeedMultiplier: 1,
    minimumPointerDrag: 72,
  },
  challenge: {
    id: 'challenge',
    title: 'Challenge',
    timingToleranceMultiplier: 0.82,
    timingSpeedMultiplier: 1.15,
    minimumPointerDrag: 82,
  },
};

export function getRainbowDiscAssistanceProfile(
  level: RainbowDiscAssistanceLevel,
): RainbowDiscAssistanceProfile {
  return RAINBOW_DISC_ASSISTANCE_PROFILES[level];
}

export function applyRainbowDiscAssistance(
  profile: RainbowDiscTimingProfile,
  level: RainbowDiscAssistanceLevel,
): RainbowDiscTimingProfile {
  const assistance = getRainbowDiscAssistanceProfile(level);
  return {
    ...profile,
    tolerance: Math.min(0.45, profile.tolerance * assistance.timingToleranceMultiplier),
    sweepSpeed: profile.sweepSpeed * assistance.timingSpeedMultiplier,
  };
}

export function isRainbowDiscReleaseAccurate(
  timingValue: number,
  tolerance: number,
  centre = RAINBOW_DISC_TIMING_CENTRE,
): boolean {
  return Math.abs(timingValue - centre) <= tolerance;
}

export function rainbowDiscMissOffset(
  timingValue: number,
  centre = RAINBOW_DISC_TIMING_CENTRE,
): number {
  return timingValue < centre ? -150 : 150;
}


export const RAINBOW_DISC_GOALS_TO_WIN = 2;

const RAINBOW_DISC_ATTACK_PATTERNS = [
  [1, 2, 0],
  [2, 0, 1],
  [0, 1, 2],
  [1, 0, 2],
] as const;

const RAINBOW_DISC_DEFENCE_PATTERNS = [
  [1, 2],
  [0, 1],
  [2, 0],
  [1, 0],
] as const;

export function rainbowDiscOpenLane(attackSequence: number, passIndex: number): number {
  const pattern =
    RAINBOW_DISC_ATTACK_PATTERNS[
      Math.abs(Math.trunc(attackSequence)) % RAINBOW_DISC_ATTACK_PATTERNS.length
    ] ?? RAINBOW_DISC_ATTACK_PATTERNS[0];
  return pattern[Math.abs(Math.trunc(passIndex)) % pattern.length] ?? 1;
}

export function rainbowDiscDefenceLane(defenceSequence: number, advance: number): number {
  const pattern =
    RAINBOW_DISC_DEFENCE_PATTERNS[
      Math.abs(Math.trunc(defenceSequence)) % RAINBOW_DISC_DEFENCE_PATTERNS.length
    ] ?? RAINBOW_DISC_DEFENCE_PATTERNS[0];
  return pattern[Math.abs(Math.trunc(advance)) % pattern.length] ?? 1;
}

export function isRainbowDiscMatchComplete(
  playerScore: number,
  oppositionScore: number,
  goalsToWin = RAINBOW_DISC_GOALS_TO_WIN,
): boolean {
  return playerScore >= goalsToWin || oppositionScore >= goalsToWin;
}

export function rainbowDiscDefenceTelegraphAlpha(level: RainbowDiscAssistanceLevel): number {
  if (level === 'gentle') return 0.9;
  if (level === 'challenge') return 0.42;
  return 0.68;
}
