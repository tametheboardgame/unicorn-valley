export type FireflyLanternMode = 'normal' | 'multicolour' | 'endless';
export type FireflyNormalDifficulty = 'gentle' | 'classic' | 'swift';
export type FireflyColour = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export const FIREFLY_NORMAL_TARGET = 8;
export const FIREFLY_MULTICOLOUR_MISTAKE_LIMIT = 3;
export const FIREFLY_ENDLESS_GLOW_THRESHOLD = 12;
export const FIREFLY_ENDLESS_MASTERY_THRESHOLD = 24;

export interface FireflyLanternTuning {
  lifetimeMs: number;
  hitSize: number;
  bobDurationMs: number;
  spawnDelayMs: number;
}

export const FIREFLY_NORMAL_TUNING: Readonly<
  Record<FireflyNormalDifficulty, FireflyLanternTuning>
> = {
  gentle: {
    lifetimeMs: 2800,
    hitSize: 132,
    bobDurationMs: 900,
    spawnDelayMs: 430,
  },
  classic: {
    lifetimeMs: 2200,
    hitSize: 112,
    bobDurationMs: 720,
    spawnDelayMs: 360,
  },
  swift: {
    lifetimeMs: 1650,
    hitSize: 92,
    bobDurationMs: 560,
    spawnDelayMs: 300,
  },
};

const MULTICOLOUR_PATTERN: readonly FireflyColour[] = [
  'yellow',
  'blue',
  'yellow',
  'pink',
  'green',
  'yellow',
  'purple',
  'yellow',
  'blue',
  'yellow',
  'green',
  'pink',
];

export function getMulticolourFireflyColour(index: number): FireflyColour {
  const safeIndex = Math.max(0, Math.floor(index));
  return MULTICOLOUR_PATTERN[safeIndex % MULTICOLOUR_PATTERN.length] ?? 'yellow';
}

export function getEndlessTuning(score: number): FireflyLanternTuning {
  const safeScore = Math.max(0, Math.floor(score));
  return {
    lifetimeMs: Math.max(850, 2350 - safeScore * 65),
    hitSize: Math.max(62, 116 - safeScore * 2),
    bobDurationMs: Math.max(400, 760 - safeScore * 12),
    spawnDelayMs: Math.max(130, 340 - safeScore * 7),
  };
}

export function isMulticolourAttemptFinished(score: number, mistakes: number): boolean {
  return score >= FIREFLY_NORMAL_TARGET || mistakes >= FIREFLY_MULTICOLOUR_MISTAKE_LIMIT;
}

export function normalCompletionCopy(score: number): string {
  if (score >= FIREFLY_NORMAL_TARGET) {
    return 'Every light made it to the lantern! ✨';
  }
  const returnedHome = Math.max(0, FIREFLY_NORMAL_TARGET - Math.max(0, Math.floor(score)));
  return `${returnedHome} ${returnedHome === 1 ? 'light found' : 'lights found'} a safe way home.`;
}

export function modeLabel(mode: FireflyLanternMode): string {
  switch (mode) {
    case 'normal':
      return 'Normal';
    case 'multicolour':
      return 'Multicolour';
    case 'endless':
      return 'Endless';
  }
}
