export type RainbowDiscAssistanceLevel = 'gentle' | 'standard' | 'challenge';

export interface RainbowDiscTimingProfile {
  tolerance: number;
  sweepSpeed: number;
  label: string;
}

export interface RainbowDiscTimingChallenge extends RainbowDiscTimingProfile {
  centre: number;
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

const RAINBOW_DISC_TIMING_CENTRES = [0.55, 0.36, 0.68, 0.46, 0.72, 0.31, 0.61, 0.43] as const;
const RAINBOW_DISC_TIMING_WIDTH_SCALES = [1, 0.86, 1.08, 0.78, 0.94, 1.04, 0.82, 0.9] as const;

export function varyRainbowDiscTimingChallenge(
  profile: RainbowDiscTimingProfile,
  throwIndex: number,
): RainbowDiscTimingChallenge {
  const index = Math.abs(Math.trunc(throwIndex));
  const requestedCentre =
    RAINBOW_DISC_TIMING_CENTRES[index % RAINBOW_DISC_TIMING_CENTRES.length] ??
    RAINBOW_DISC_TIMING_CENTRE;
  const widthScale =
    RAINBOW_DISC_TIMING_WIDTH_SCALES[index % RAINBOW_DISC_TIMING_WIDTH_SCALES.length] ?? 1;
  const tolerance = Math.max(0.07, Math.min(0.42, profile.tolerance * widthScale));
  const edgePadding = 0.035;
  const centre = Math.max(
    tolerance + edgePadding,
    Math.min(1 - tolerance - edgePadding, requestedCentre),
  );

  return {
    ...profile,
    tolerance,
    centre,
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
