import type { DiscoveryId, ItemId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';

export const CRYSTAL_BROOK_LOCATION_ID = 'location:crystal-brook';

export interface CrystalBrookEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west' | 'east';
}

export interface CrystalBrookCollectableSpot {
  id: string;
  itemId: ItemId;
  discoveryId: DiscoveryId;
  flagId: string;
  label: string;
  position: MapPoint;
  collectionRadius: number;
}

export interface CrystalBrookNpcVisitPoint {
  id: string;
  label: string;
  position: MapPoint;
}

export interface CrystalBrookSecretRoute {
  id: string;
  label: string;
  discoveryId: DiscoveryId;
  position: MapPoint;
  discoveryRadius: number;
  trail: readonly MapPoint[];
}

export interface CrystalBrookActivityPocket {
  id: 'crystalarium' | 'crystal-checkers';
  centre: MapPoint;
  approach: MapPoint;
  radiusX: number;
  radiusY: number;
}

export interface CrystalBrookWatercoursePoint extends MapPoint {
  outerWidth: number;
  innerWidth: number;
  deepWidth: number;
}

const DEFAULT_PLAYER_SPAWN = { x: 360, y: 1090 } as const;

export const CRYSTAL_BROOK_MEADOW_THRESHOLD = {
  id: 'rainbow-meadow',
  label: 'Rainbow Meadow',
  position: { x: 120, y: 1090 },
  approach: { x: 340, y: 1090 },
  direction: 'west',
} as const;
export const CRYSTAL_BROOK_WOODS_THRESHOLD = {
  position: { x: 3260, y: 990 },
  approach: { x: 3070, y: 1010 },
} as const;
export const CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD = {
  position: { x: 2860, y: 850 },
  approach: { x: 2660, y: 900 },
} as const;
export const CRYSTAL_BROOK_GROTTO_THRESHOLD = {
  position: { x: 3130, y: 1850 },
  approach: { x: 2980, y: 1780 },
  returnPosition: { x: 3020, y: 1740 },
} as const;

export const CRYSTAL_BROOK_MAIN_ROUTE = [
  { x: 100, y: 1090 },
  { x: 850, y: 1090 },
  { x: 1510, y: 1260 },
  { x: 2050, y: 1080 },
  { x: 2600, y: 1190 },
  { x: 3230, y: 990 },
] as const;

// H6.2 presentation route only: keeps the walking path visibly alongside the Brook
// without changing the canonical traversal/gateway route above. H6.5 owns any later
// structural path redesign.
export const CRYSTAL_BROOK_PATH_PRESENTATION_ROUTE = [
  { x: 100, y: 1190 },
  { x: 480, y: 1210 },
  { x: 850, y: 1230 },
  { x: 1180, y: 1300 },
  { x: 1510, y: 1360 },
  { x: 2050, y: 1195 },
  { x: 2600, y: 1305 },
  { x: 3230, y: 1070 },
] as const satisfies readonly MapPoint[];
export const CRYSTAL_BROOK_WOODS_ROUTE = [
  { x: 2580, y: 1200 },
  { x: 2810, y: 1110 },
  { x: 3050, y: 1030 },
  { x: 3260, y: 990 },
] as const;
export const CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE = [
  { x: 2520, y: 1170 },
  { x: 2620, y: 1050 },
  { x: 2740, y: 940 },
  { x: 2860, y: 850 },
] as const;
export const CRYSTAL_BROOK_GROTTO_ROUTE = [
  { x: 2480, y: 1540 },
  { x: 2630, y: 1630 },
  { x: 2770, y: 1720 },
  { x: 2940, y: 1800 },
  { x: 3130, y: 1850 },
] as const;

export const CRYSTAL_BROOK_UPPER_POOL = { x: 1370, y: 540 } as const;
export const CRYSTAL_BROOK_LOWER_POOL = { x: 2780, y: 1320 } as const;
export const CRYSTAL_BROOK_UPSTREAM_CASCADE = { x: 3150, y: 650 } as const;

export const CRYSTAL_BROOK_WATERCOURSE = [
  { x: 3420, y: 390, outerWidth: 142, innerWidth: 102, deepWidth: 38 },
  { x: 3290, y: 500, outerWidth: 162, innerWidth: 116, deepWidth: 42 },
  { x: 3150, y: 650, outerWidth: 190, innerWidth: 136, deepWidth: 48 },
  { x: 3030, y: 830, outerWidth: 178, innerWidth: 128, deepWidth: 46 },
  { x: 2910, y: 1050, outerWidth: 172, innerWidth: 124, deepWidth: 44 },
  { x: 2780, y: 1320, outerWidth: 350, innerWidth: 252, deepWidth: 100 },
  { x: 2550, y: 1290, outerWidth: 200, innerWidth: 144, deepWidth: 54 },
  { x: 2320, y: 1210, outerWidth: 180, innerWidth: 130, deepWidth: 48 },
  { x: 2070, y: 1150, outerWidth: 168, innerWidth: 122, deepWidth: 44 },
  { x: 1840, y: 1070, outerWidth: 162, innerWidth: 118, deepWidth: 42 },
  { x: 1600, y: 900, outerWidth: 182, innerWidth: 132, deepWidth: 48 },
  { x: 1370, y: 540, outerWidth: 390, innerWidth: 284, deepWidth: 120 },
  { x: 1190, y: 760, outerWidth: 205, innerWidth: 148, deepWidth: 54 },
  { x: 1030, y: 990, outerWidth: 170, innerWidth: 122, deepWidth: 44 },
  { x: 760, y: 1060, outerWidth: 150, innerWidth: 108, deepWidth: 38 },
  { x: 480, y: 1090, outerWidth: 142, innerWidth: 102, deepWidth: 36 },
  { x: 120, y: 1090, outerWidth: 146, innerWidth: 104, deepWidth: 36 },
  { x: -110, y: 1090, outerWidth: 146, innerWidth: 104, deepWidth: 36 },
] as const satisfies readonly CrystalBrookWatercoursePoint[];

export const CRYSTAL_BROOK_REFLECTION_INLET = {
  points: [
    { x: 2320, y: 1210 },
    { x: 2280, y: 1390 },
    { x: 2190, y: 1530 },
    { x: 2150, y: 1650 },
  ] as const satisfies readonly MapPoint[],
  outerWidth: 126,
  innerWidth: 88,
  deepWidth: 34,
} as const;

export const CRYSTAL_BROOK_WATER_GLINTS = [
  { x: 3190, y: 615, width: 74, angle: -28 },
  { x: 2830, y: 1270, width: 108, angle: -8 },
  { x: 2360, y: 1195, width: 82, angle: 9 },
  { x: 1810, y: 1020, width: 76, angle: 18 },
  { x: 1380, y: 590, width: 118, angle: -5 },
  { x: 990, y: 975, width: 72, angle: -12 },
  { x: 470, y: 1080, width: 86, angle: 0 },
  { x: 2180, y: 1575, width: 68, angle: -22 },
] as const;

export const CRYSTAL_BROOK_RIPPLE_OVERLOOK = { x: 1720, y: 830 } as const;
export const CRYSTAL_BROOK_ECHO_CLUE = { x: 2800, y: 1400 } as const;
export const CRYSTAL_BROOK_WATERFALL_MIST = { x: 3150, y: 735 } as const;
export const CRYSTAL_BROOK_WATERFALL_PRESENTATION = { x: 3150, y: 600 } as const;
export const CRYSTAL_BROOK_REFLECTION_POOL = { x: 2150, y: 1650 } as const;
export const CRYSTAL_BROOK_STEPPING_CHIME = { x: 2320, y: 1225 } as const;
export const CRYSTAL_BROOK_SHALLOW_RIPPLE = { x: 1900, y: 1110 } as const;
export const CRYSTAL_BROOK_SINGING_CRYSTALS = { x: 2440, y: 1110 } as const;
export const CRYSTAL_BROOK_SHELL_SPARKLE = { x: 1760, y: 980 } as const;
export const CRYSTAL_BROOK_PEBBLE_STACK = { x: 1160, y: 1290 } as const;
export const CRYSTAL_BROOK_CASCADE_MEMORY = { x: 2660, y: 1160 } as const;

export const CRYSTAL_BROOK_SHALLOW_STREAM_HINT = { x: 1640, y: 960 } as const;
export const CRYSTAL_BROOK_GROTTO_CUE = { x: 2490, y: 1450 } as const;
export const CRYSTAL_BROOK_ECHO_WAYPOINTS = [
  { id: 'echo-brook-a', x: 2860, y: 1690, pauseMs: 2200 },
  { id: 'echo-brook-b', x: 2990, y: 1760, pauseMs: 2800 },
  { id: 'echo-brook-c', x: 3180, y: 1650, pauseMs: 2100 },
] as const;

export const CRYSTAL_BROOK_DISTRICTS = [
  { id: 'meadow-gorge', centre: { x: 430, y: 1090 }, radiusX: 430, radiusY: 390 },
  { id: 'central-brook', centre: { x: 1770, y: 1120 }, radiusX: 980, radiusY: 620 },
  { id: 'upstream-cascade', centre: { x: 2780, y: 760 }, radiusX: 620, radiusY: 470 },
  { id: 'grotto-bank', centre: { x: 2860, y: 1710 }, radiusX: 560, radiusY: 370 },
] as const;

export const CRYSTAL_BROOK_BOUNDARY_OPENINGS = [
  {
    id: 'rainbow-meadow-gorge',
    position: CRYSTAL_BROOK_MEADOW_THRESHOLD.position,
    approach: CRYSTAL_BROOK_MEADOW_THRESHOLD.approach,
    width: 300,
  },
  {
    id: 'whispering-woods-pass',
    position: CRYSTAL_BROOK_WOODS_THRESHOLD.position,
    approach: CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
    width: 300,
  },
  {
    id: 'crystal-cup-route',
    position: CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.position,
    approach: CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.approach,
    width: 300,
  },
] as const;

export const CRYSTAL_BROOK_ACTIVITY_POCKETS = [
  {
    id: 'crystalarium',
    centre: { x: 1450, y: 1640 },
    approach: { x: 1450, y: 1450 },
    radiusX: 330,
    radiusY: 250,
  },
  {
    id: 'crystal-checkers',
    centre: { x: 760, y: 1540 },
    approach: { x: 820, y: 1380 },
    radiusX: 280,
    radiusY: 220,
  },
] as const satisfies readonly CrystalBrookActivityPocket[];

export const CRYSTAL_BROOK_LAYOUT = {
  bounds: { width: 3500, height: 2200, margin: 90 },
  playerSpawn: DEFAULT_PLAYER_SPAWN,
  thresholds: {
    rainbowMeadow: CRYSTAL_BROOK_MEADOW_THRESHOLD,
    whisperingWoods: CRYSTAL_BROOK_WOODS_THRESHOLD,
    crystalCupHub: CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD,
    crystalGrotto: CRYSTAL_BROOK_GROTTO_THRESHOLD,
  },
  routes: {
    main: CRYSTAL_BROOK_MAIN_ROUTE,
    whisperingWoods: CRYSTAL_BROOK_WOODS_ROUTE,
    crystalCupHub: CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE,
    crystalGrotto: CRYSTAL_BROOK_GROTTO_ROUTE,
  },
  water: {
    upperPool: CRYSTAL_BROOK_UPPER_POOL,
    lowerPool: CRYSTAL_BROOK_LOWER_POOL,
    upstreamCascade: CRYSTAL_BROOK_UPSTREAM_CASCADE,
    watercourse: CRYSTAL_BROOK_WATERCOURSE,
    reflectionInlet: CRYSTAL_BROOK_REFLECTION_INLET,
    reflectionPool: CRYSTAL_BROOK_REFLECTION_POOL,
  },
  landmarks: {
    rippleOverlook: CRYSTAL_BROOK_RIPPLE_OVERLOOK,
    echoCrystalClue: CRYSTAL_BROOK_ECHO_CLUE,
    waterfallMist: CRYSTAL_BROOK_WATERFALL_MIST,
    waterfallPresentation: CRYSTAL_BROOK_WATERFALL_PRESENTATION,
    reflectionPool: CRYSTAL_BROOK_REFLECTION_POOL,
    steppingChime: CRYSTAL_BROOK_STEPPING_CHIME,
    shallowRipple: CRYSTAL_BROOK_SHALLOW_RIPPLE,
    singingCrystals: CRYSTAL_BROOK_SINGING_CRYSTALS,
    shellSparkle: CRYSTAL_BROOK_SHELL_SPARKLE,
    pebbleStack: CRYSTAL_BROOK_PEBBLE_STACK,
    cascadeMemory: CRYSTAL_BROOK_CASCADE_MEMORY,
  },
  guidance: {
    shallowStreamHint: CRYSTAL_BROOK_SHALLOW_STREAM_HINT,
    crystalGrottoCue: CRYSTAL_BROOK_GROTTO_CUE,
  },
  echo: { waypoints: CRYSTAL_BROOK_ECHO_WAYPOINTS },
} as const;

const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setCrystalBrookPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetCrystalBrookPlayerSpawn(): void {
  setCrystalBrookPlayerSpawn(DEFAULT_PLAYER_SPAWN);
}

export const CRYSTAL_BROOK_MAP = {
  width: 3500,
  height: 2200,
  margin: 90,
  playerSpawn,
  entrances: [CRYSTAL_BROOK_MEADOW_THRESHOLD] satisfies readonly CrystalBrookEntrance[],
  shallowStream: {
    width: 190,
    points: CRYSTAL_BROOK_WATERCOURSE,
  },
  steppingStones: [
    { x: 1010, y: 1010 },
    { x: 1125, y: 970 },
    { x: 1240, y: 1015 },
    { x: 2200, y: 1180 },
    { x: 2315, y: 1225 },
    { x: 2430, y: 1180 },
  ] satisfies readonly MapPoint[],
  collectableSpots: [
    {
      id: 'crystal-north-bank',
      itemId: 'item:brook-river-crystal',
      discoveryId: 'discovery:brook-river-crystal',
      flagId: 'flag:r5-brook-crystal-north-bank',
      label: 'River Crystal',
      position: { x: 920, y: 590 },
      collectionRadius: 76,
    },
    {
      id: 'crystal-stepping-bend',
      itemId: 'item:brook-river-crystal',
      discoveryId: 'discovery:brook-river-crystal',
      flagId: 'flag:r5-brook-crystal-stepping-bend',
      label: 'River Crystal',
      position: { x: 1510, y: 1260 },
      collectionRadius: 76,
    },
    {
      id: 'shell-reed-bank',
      itemId: 'item:brook-singing-shell',
      discoveryId: 'discovery:brook-singing-shell',
      flagId: 'flag:r5-brook-shell-reed-bank',
      label: 'Singing Shell',
      position: { x: 1980, y: 630 },
      collectionRadius: 76,
    },
    {
      id: 'shell-lower-pool',
      itemId: 'item:brook-singing-shell',
      discoveryId: 'discovery:brook-singing-shell',
      flagId: 'flag:r5-brook-shell-lower-pool',
      label: 'Singing Shell',
      position: { x: 2790, y: 1510 },
      collectionRadius: 76,
    },
  ] satisfies readonly CrystalBrookCollectableSpot[],
  npcVisitPoints: [
    {
      id: 'brook-overlook',
      label: 'Brook Overlook',
      position: CRYSTAL_BROOK_RIPPLE_OVERLOOK,
    },
    {
      id: 'grotto-clearing',
      label: 'Grotto Clearing',
      position: CRYSTAL_BROOK_GROTTO_THRESHOLD.approach,
    },
  ] satisfies readonly CrystalBrookNpcVisitPoint[],
  secretRoutes: [
    {
      id: 'prism-grotto-route',
      label: 'Prism Grotto',
      discoveryId: 'discovery:prism-grotto',
      position: CRYSTAL_BROOK_GROTTO_THRESHOLD.position,
      discoveryRadius: 105,
      trail: CRYSTAL_BROOK_GROTTO_ROUTE,
    },
  ] satisfies readonly CrystalBrookSecretRoute[],
  colliders: [
    { id: 'collision:brook-upper-deep-water', x: 1370, y: 540, width: 230, height: 82 },
    { id: 'collision:brook-lower-deep-water', x: 2780, y: 1320, width: 220, height: 86 },
    { id: 'collision:cliff-west', x: 520, y: 410, width: 320, height: 150 },
    { id: 'collision:cliff-north-west', x: 880, y: 350, width: 260, height: 135 },
    { id: 'collision:cliff-north-east', x: 2350, y: 310, width: 300, height: 150 },
    { id: 'collision:cliff-east', x: 3190, y: 520, width: 300, height: 170 },
    { id: 'collision:north-crystal-bank', x: 2470, y: 505, width: 230, height: 125 },
    { id: 'collision:south-reed-bank', x: 1890, y: 1770, width: 230, height: 115 },
    { id: 'collision:brook-upstream-cascade', x: 3150, y: 650, width: 118, height: 220 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type CrystalBrookMap = typeof CRYSTAL_BROOK_MAP;
