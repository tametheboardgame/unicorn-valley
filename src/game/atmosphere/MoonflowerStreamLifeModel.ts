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
