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
