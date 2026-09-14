export const AMBIENT_STREAM_FISH_NAME_PREFIX = 'ambient-stream-fish:moonflower:';

export const MOONFLOWER_STREAM_FISHING_HOOK = {
  id: 'stream:moonflower-glade',
  sceneKey: 'MoonflowerGladeScene',
  bounds: {
    left: 1290,
    right: 1510,
    top: 0,
    bottom: 1800,
  },
  fishNamePrefix: AMBIENT_STREAM_FISH_NAME_PREFIX,
} as const;

export const MOONFLOWER_STREAM_SURFACE_MARKS = [
  { x: 1370, y: 145, width: 70, height: 14, drift: 13, duration: 2300 },
  { x: 1437, y: 318, width: 48, height: 11, drift: -10, duration: 2800 },
  { x: 1361, y: 514, width: 82, height: 16, drift: 16, duration: 3200 },
  { x: 1442, y: 733, width: 62, height: 13, drift: -14, duration: 2500 },
  { x: 1368, y: 1068, width: 54, height: 12, drift: 11, duration: 3000 },
  { x: 1430, y: 1263, width: 78, height: 15, drift: -16, duration: 3350 },
  { x: 1378, y: 1518, width: 58, height: 12, drift: 15, duration: 2650 },
  { x: 1440, y: 1694, width: 69, height: 14, drift: -12, duration: 3100 },
] as const;

export const MOONFLOWER_STREAM_REED_BEDS = [
  { id: 'north-west', x: 1225, y: 565, width: 110 },
  { id: 'north-east', x: 1570, y: 720, width: 105 },
  { id: 'south-west', x: 1220, y: 1265, width: 122 },
  { id: 'south-east', x: 1580, y: 1460, width: 120 },
] as const;

export type AmbientFishMovementProfile = 'straight' | 'meander' | 'weave' | 'zigzag';

export interface AmbientFishBehaviour {
  id: string;
  profile: AmbientFishMovementProfile;
  durationScale: number;
  lateralAmplitude: number;
  cycles: number;
  phase: number;
}

/**
 * H1.6b gives the four ambient fish distinct movement personalities. The speed multipliers are
 * intentionally broad enough to be visible in play while all fish still travel generally downstream.
 */
export const MOONFLOWER_STREAM_FISH_BEHAVIOURS: readonly AmbientFishBehaviour[] = [
  {
    id: 'silver-drifter',
    profile: 'meander',
    durationScale: 1.3,
    lateralAmplitude: 18,
    cycles: 1.35,
    phase: 0.12,
  },
  {
    id: 'lilac-dart',
    profile: 'straight',
    durationScale: 0.72,
    lateralAmplitude: 5,
    cycles: 0.8,
    phase: 0.42,
  },
  {
    id: 'gold-weaver',
    profile: 'weave',
    durationScale: 0.96,
    lateralAmplitude: 14,
    cycles: 2.55,
    phase: 0.68,
  },
  {
    id: 'green-zigzag',
    profile: 'zigzag',
    durationScale: 1.08,
    lateralAmplitude: 16,
    cycles: 3.1,
    phase: 0.24,
  },
] as const;

export interface AmbientFishRun {
  x: number;
  durationMs: number;
  shouldSurface: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function resolveAmbientFishRun(
  laneSample: number,
  speedSample: number,
  surfaceSample: number,
): AmbientFishRun {
  const lane = clamp01(laneSample);
  const speed = clamp01(speedSample);
  return {
    x: lerp(1348, 1452, lane),
    durationMs: Math.round(lerp(9_200, 15_400, speed)),
    shouldSurface: clamp01(surfaceSample) < 0.32,
  };
}

export function resolveAmbientFishLateralOffset(
  behaviour: AmbientFishBehaviour,
  progress: number,
): number {
  const p = clamp01(progress);
  const angle = (p * behaviour.cycles + behaviour.phase) * Math.PI * 2;

  switch (behaviour.profile) {
    case 'straight':
      return Math.sin(angle) * behaviour.lateralAmplitude * 0.22;
    case 'meander':
      return Math.sin(angle) * behaviour.lateralAmplitude;
    case 'weave':
      return (
        Math.sin(angle) * behaviour.lateralAmplitude * 0.72 +
        Math.sin(angle * 0.52 + 1.1) * behaviour.lateralAmplitude * 0.28
      );
    case 'zigzag':
      return Math.asin(Math.sin(angle)) * (2 / Math.PI) * behaviour.lateralAmplitude;
  }
}
