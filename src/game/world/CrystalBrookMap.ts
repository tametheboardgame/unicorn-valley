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
  position: { x: 3260, y: 1510 },
  approach: { x: 3090, y: 1460 },
} as const;
export const CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD = {
  position: { x: 2860, y: 120 },
  approach: { x: 2860, y: 330 },
} as const;
export const CRYSTAL_BROOK_GROTTO_THRESHOLD = {
  position: { x: 3130, y: 1850 },
  approach: { x: 2980, y: 1780 },
  returnPosition: { x: 3020, y: 1740 },
} as const;

export interface CrystalBrookBridgeDefinition {
  id: 'central-crossing' | 'woods-crossing';
  centre: MapPoint;
  angle: number;
  length: number;
  deckWidth: number;
  westLanding: MapPoint;
  eastLanding: MapPoint;
}

export const CRYSTAL_BROOK_CENTRAL_BRIDGE = {
  id: 'central-crossing',
  centre: { x: 2290, y: 1210 },
  angle: -16,
  length: 340,
  deckWidth: 94,
  westLanding: { x: 2130, y: 1255 },
  eastLanding: { x: 2450, y: 1165 },
} as const satisfies CrystalBrookBridgeDefinition;

export const CRYSTAL_BROOK_WOODS_BRIDGE = {
  id: 'woods-crossing',
  centre: { x: 2800, y: 1385 },
  angle: 14,
  length: 390,
  deckWidth: 94,
  westLanding: { x: 2610, y: 1338 },
  eastLanding: { x: 2990, y: 1432 },
} as const satisfies CrystalBrookBridgeDefinition;

export const CRYSTAL_BROOK_ICE_BRIDGES = [
  CRYSTAL_BROOK_CENTRAL_BRIDGE,
  CRYSTAL_BROOK_WOODS_BRIDGE,
] as const satisfies readonly CrystalBrookBridgeDefinition[];

export const CRYSTAL_BROOK_MAIN_ROUTE = [
  { x: 100, y: 1090 },
  { x: 850, y: 1090 },
  { x: 1510, y: 1260 },
  { x: 2050, y: 1220 },
  CRYSTAL_BROOK_CENTRAL_BRIDGE.westLanding,
  CRYSTAL_BROOK_CENTRAL_BRIDGE.eastLanding,
  { x: 2580, y: 1160 },
  CRYSTAL_BROOK_WOODS_BRIDGE.westLanding,
  CRYSTAL_BROOK_WOODS_BRIDGE.eastLanding,
  CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
  CRYSTAL_BROOK_WOODS_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS = [
  [
    { x: 100, y: 1090 },
    { x: 340, y: 1090 },
    { x: 620, y: 1160 },
    { x: 900, y: 1220 },
    { x: 1200, y: 1280 },
    { x: 1510, y: 1320 },
    { x: 1800, y: 1260 },
    { x: 2050, y: 1220 },
    CRYSTAL_BROOK_CENTRAL_BRIDGE.westLanding,
  ],
  [
    CRYSTAL_BROOK_CENTRAL_BRIDGE.eastLanding,
    { x: 2580, y: 1160 },
    CRYSTAL_BROOK_WOODS_BRIDGE.westLanding,
  ],
  [
    CRYSTAL_BROOK_WOODS_BRIDGE.eastLanding,
    CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
    CRYSTAL_BROOK_WOODS_THRESHOLD.position,
  ],
] as const satisfies readonly (readonly MapPoint[])[];

export const CRYSTAL_BROOK_WOODS_ROUTE = [
  { x: 2580, y: 1160 },
  CRYSTAL_BROOK_WOODS_BRIDGE.westLanding,
  CRYSTAL_BROOK_WOODS_BRIDGE.eastLanding,
  CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
  CRYSTAL_BROOK_WOODS_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE = [
  { x: 2580, y: 1160 },
  { x: 2660, y: 1000 },
  { x: 2740, y: 790 },
  { x: 2810, y: 560 },
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.approach,
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE =
  CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE;

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
export const CRYSTAL_BROOK_MEADOW_WATER_EXIT = { x: 120, y: 920 } as const;

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
  { x: 760, y: 1040, outerWidth: 150, innerWidth: 108, deepWidth: 38 },
  { x: 520, y: 1010, outerWidth: 142, innerWidth: 102, deepWidth: 36 },
  { x: 300, y: 960, outerWidth: 140, innerWidth: 100, deepWidth: 36 },
  {
    x: CRYSTAL_BROOK_MEADOW_WATER_EXIT.x,
    y: CRYSTAL_BROOK_MEADOW_WATER_EXIT.y,
    outerWidth: 142,
    innerWidth: 102,
    deepWidth: 36,
  },
  { x: -110, y: 900, outerWidth: 142, innerWidth: 102, deepWidth: 36 },
] as const satisfies readonly CrystalBrookWatercoursePoint[];

export const CRYSTAL_BROOK_REFLECTION_FEEDER = {
  points: [
    { x: 2550, y: 1290 },
    { x: 2480, y: 1390 },
    { x: 2370, y: 1485 },
    { x: 2240, y: 1565 },
    { x: 2150, y: 1650 },
  ] as const satisfies readonly MapPoint[],
  outerWidth: 58,
  innerWidth: 34,
} as const;

export const CRYSTAL_BROOK_WATER_GLINTS = [
  { x: 3190, y: 615, width: 74, angle: -28 },
  { x: 2830, y: 1270, width: 108, angle: -8 },
  { x: 2360, y: 1195, width: 82, angle: 9 },
  { x: 1810, y: 1020, width: 76, angle: 18 },
  { x: 1380, y: 590, width: 118, angle: -5 },
  { x: 990, y: 975, width: 72, angle: -12 },
  { x: 470, y: 995, width: 82, angle: -10 },
  { x: 2260, y: 1550, width: 46, angle: -26 },
] as const;

export const CRYSTAL_BROOK_RIPPLE_OVERLOOK = { x: 1720, y: 830 } as const;
export const CRYSTAL_BROOK_ECHO_CLUE = { x: 2800, y: 1400 } as const;
export const CRYSTAL_BROOK_WATERFALL_MIST = { x: 3150, y: 735 } as const;
export const CRYSTAL_BROOK_WATERFALL_PRESENTATION = { x: 3150, y: 600 } as const;
export const CRYSTAL_BROOK_REFLECTION_POOL = { x: 2150, y: 1650 } as const;
export const CRYSTAL_BROOK_STEPPING_CHIME = { x: 1125, y: 970 } as const;
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
    crystalCupPresentation: CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE,
    crystalGrotto: CRYSTAL_BROOK_GROTTO_ROUTE,
  },
  water: {
    upperPool: CRYSTAL_BROOK_UPPER_POOL,
    lowerPool: CRYSTAL_BROOK_LOWER_POOL,
    upstreamCascade: CRYSTAL_BROOK_UPSTREAM_CASCADE,
    meadowWaterExit: CRYSTAL_BROOK_MEADOW_WATER_EXIT,
    watercourse: CRYSTAL_BROOK_WATERCOURSE,
    reflectionFeeder: CRYSTAL_BROOK_REFLECTION_FEEDER,
    reflectionPool: CRYSTAL_BROOK_REFLECTION_POOL,
    bridges: CRYSTAL_BROOK_ICE_BRIDGES,
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
