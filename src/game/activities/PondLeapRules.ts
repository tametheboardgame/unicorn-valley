export type PondLeapAssistanceLevel = 'relaxed' | 'standard' | 'quick';
export type PondLeapCourseId = 'sunny-steps' | 'reed-weave' | 'twinkle-trail';
export type PondLeapMode = 'classic' | 'practice' | 'ripple-rush';

export const POND_LEAP_MODES: readonly PondLeapMode[] = ['classic', 'practice', 'ripple-rush'];

export const POND_LEAP_ASSISTANCE_LEVELS: readonly PondLeapAssistanceLevel[] = [
  'relaxed',
  'standard',
  'quick',
];

export const POND_LEAP_COURSE_IDS: readonly PondLeapCourseId[] = [
  'sunny-steps',
  'reed-weave',
  'twinkle-trail',
];

export interface PondLeapPoint {
  x: number;
  y: number;
}

export interface PondLeapAssistanceProfile {
  id: PondLeapAssistanceLevel;
  title: string;
  toleranceMultiplier: number;
  speedMultiplier: number;
}

export interface PondLeapCourseDefinition {
  id: PondLeapCourseId;
  title: string;
  pads: readonly PondLeapPoint[];
  timingCentres: readonly number[];
  timingTolerances: readonly number[];
  sweepSpeeds: readonly number[];
  accent: number;
}

export interface PondLeapTimingChallenge {
  centre: number;
  tolerance: number;
  sweepSpeed: number;
}

export interface PondLeapModeRunState {
  attempts: number;
  successes: number;
  streak: number;
  bestStreak: number;
  splashes: number;
}

export const POND_LEAP_PRACTICE_ATTEMPTS = 10;
export const POND_LEAP_RIPPLE_RUSH_HOPS = 8;
export const POND_LEAP_RIPPLE_RUSH_SPLASH_LIMIT = 3;

export const POND_LEAP_ASSISTANCE_PROFILES: Readonly<
  Record<PondLeapAssistanceLevel, PondLeapAssistanceProfile>
> = {
  relaxed: {
    id: 'relaxed',
    title: 'Relaxed',
    toleranceMultiplier: 1.32,
    speedMultiplier: 0.78,
  },
  standard: {
    id: 'standard',
    title: 'Standard',
    toleranceMultiplier: 1,
    speedMultiplier: 1,
  },
  quick: {
    id: 'quick',
    title: 'Quick',
    toleranceMultiplier: 0.82,
    speedMultiplier: 1.18,
  },
};

export const POND_LEAP_COURSES: Readonly<Record<PondLeapCourseId, PondLeapCourseDefinition>> = {
  'sunny-steps': {
    id: 'sunny-steps',
    title: 'Sunny Steps',
    pads: [
      { x: 190, y: 395 },
      { x: 360, y: 300 },
      { x: 545, y: 410 },
      { x: 725, y: 285 },
      { x: 910, y: 390 },
      { x: 1080, y: 295 },
    ],
    timingCentres: [0.34, 0.62, 0.48, 0.7, 0.42],
    timingTolerances: [0.18, 0.16, 0.14, 0.13, 0.12],
    sweepSpeeds: [0.0042, 0.00455, 0.0049, 0.00525, 0.0056],
    accent: 0xf3d66f,
  },
  'reed-weave': {
    id: 'reed-weave',
    title: 'Reed Weave',
    pads: [
      { x: 190, y: 360 },
      { x: 350, y: 250 },
      { x: 520, y: 430 },
      { x: 700, y: 245 },
      { x: 890, y: 425 },
      { x: 1080, y: 310 },
    ],
    timingCentres: [0.28, 0.7, 0.39, 0.74, 0.34],
    timingTolerances: [0.17, 0.15, 0.14, 0.12, 0.11],
    sweepSpeeds: [0.00435, 0.00475, 0.0051, 0.00545, 0.0058],
    accent: 0x8dc9a0,
  },
  'twinkle-trail': {
    id: 'twinkle-trail',
    title: 'Twinkle Trail',
    pads: [
      { x: 190, y: 385 },
      { x: 350, y: 320 },
      { x: 525, y: 255 },
      { x: 705, y: 405 },
      { x: 895, y: 280 },
      { x: 1080, y: 380 },
    ],
    timingCentres: [0.22, 0.67, 0.41, 0.78, 0.31],
    timingTolerances: [0.15, 0.14, 0.12, 0.11, 0.1],
    sweepSpeeds: [0.0046, 0.005, 0.0054, 0.0058, 0.0062],
    accent: 0xc99cdb,
  },
};

export function getPondLeapAssistanceProfile(
  level: PondLeapAssistanceLevel,
): PondLeapAssistanceProfile {
  return POND_LEAP_ASSISTANCE_PROFILES[level];
}

export function getPondLeapCourse(courseId: PondLeapCourseId): PondLeapCourseDefinition {
  return POND_LEAP_COURSES[courseId];
}

export function getPondLeapTimingChallenge(
  courseId: PondLeapCourseId,
  hopIndex: number,
  assistanceLevel: PondLeapAssistanceLevel,
): PondLeapTimingChallenge {
  const course = getPondLeapCourse(courseId);
  const assistance = getPondLeapAssistanceProfile(assistanceLevel);
  const maxHopIndex = Math.max(0, course.pads.length - 2);
  const index = Math.max(0, Math.min(maxHopIndex, Math.trunc(hopIndex)));
  const centre = course.timingCentres[index] ?? 0.5;
  const baseTolerance = course.timingTolerances[index] ?? 0.12;
  const baseSweepSpeed = course.sweepSpeeds[index] ?? 0.0048;
  const tolerance = Math.max(0.07, Math.min(0.32, baseTolerance * assistance.toleranceMultiplier));

  return {
    centre,
    tolerance,
    sweepSpeed: baseSweepSpeed * assistance.speedMultiplier,
  };
}

export function isPondLeapTimingSuccessful(
  timingValue: number,
  challenge: Pick<PondLeapTimingChallenge, 'centre' | 'tolerance'>,
): boolean {
  return Math.abs(timingValue - challenge.centre) <= challenge.tolerance;
}

export function isPondLeapCourseComplete(hopIndex: number, courseId: PondLeapCourseId): boolean {
  return hopIndex >= getPondLeapCourse(courseId).pads.length - 1;
}

export function isPondLeapRippleRushFailed(
  splashes: number,
  splashLimit = POND_LEAP_RIPPLE_RUSH_SPLASH_LIMIT,
): boolean {
  return splashes >= splashLimit;
}

export function createPondLeapModeRunState(): PondLeapModeRunState {
  return {
    attempts: 0,
    successes: 0,
    streak: 0,
    bestStreak: 0,
    splashes: 0,
  };
}

export function recordPondLeapModeAttempt(
  state: PondLeapModeRunState,
  success: boolean,
): PondLeapModeRunState {
  const streak = success ? state.streak + 1 : 0;
  return {
    attempts: state.attempts + 1,
    successes: state.successes + (success ? 1 : 0),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    splashes: state.splashes + (success ? 0 : 1),
  };
}

export function isPondLeapModeFinished(mode: PondLeapMode, state: PondLeapModeRunState): boolean {
  if (mode === 'practice') {
    return state.attempts >= POND_LEAP_PRACTICE_ATTEMPTS;
  }

  if (mode === 'ripple-rush') {
    return (
      state.successes >= POND_LEAP_RIPPLE_RUSH_HOPS ||
      isPondLeapRippleRushFailed(state.splashes)
    );
  }

  return false;
}

export function applyPondLeapModePressure(
  challenge: PondLeapTimingChallenge,
  mode: PondLeapMode,
  successfulHops: number,
): PondLeapTimingChallenge {
  if (mode !== 'ripple-rush') {
    return challenge;
  }

  const progress = Math.max(0, Math.min(POND_LEAP_RIPPLE_RUSH_HOPS - 1, successfulHops));
  const toleranceScale = Math.max(0.76, 1 - progress * 0.035);
  const speedScale = Math.min(1.26, 1 + progress * 0.04);

  return {
    ...challenge,
    tolerance: Math.max(0.06, challenge.tolerance * toleranceScale),
    sweepSpeed: challenge.sweepSpeed * speedScale,
  };
}


export function pondLeapModeTitle(mode: PondLeapMode): string {
  switch (mode) {
    case 'classic':
      return 'Classic Crossing';
    case 'practice':
      return 'Practice Pond';
    case 'ripple-rush':
      return 'Ripple Rush';
  }
}

export function defaultPondLeapAssistance(mode: PondLeapMode): PondLeapAssistanceLevel {
  switch (mode) {
    case 'practice':
      return 'relaxed';
    case 'ripple-rush':
      return 'quick';
    case 'classic':
      return 'standard';
  }
}
