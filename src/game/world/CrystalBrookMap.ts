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
  position: { x: 3400, y: 1580 },
  approach: { x: 3200, y: 1500 },
} as const;
export const CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD = {
  position: { x: 2860, y: 120 },
  approach: { x: 2860, y: 330 },
} as const;
export const CRYSTAL_BROOK_GROTTO_THRESHOLD = {
  position: { x: 2440, y: 2070 },
  approach: { x: 2440, y: 1880 },
  returnPosition: { x: 2440, y: 1830 },
} as const;

export interface CrystalBrookBridgeDefinition {
  id: 'north-crossing' | 'east-crossing';
  centre: MapPoint;
  angle: number;
  length: number;
  deckWidth: number;
  startLanding: MapPoint;
  endLanding: MapPoint;
}

export const CRYSTAL_BROOK_NORTH_BRIDGE = {
  id: 'north-crossing',
  centre: { x: 2350, y: 1235 },
  angle: -72,
  length: 300,
  deckWidth: 92,
  startLanding: { x: 2304, y: 1378 },
  endLanding: { x: 2396, y: 1092 },
} as const satisfies CrystalBrookBridgeDefinition;

export const CRYSTAL_BROOK_EAST_BRIDGE = {
  id: 'east-crossing',
  centre: { x: 2810, y: 1038 },
  angle: -6,
  length: 310,
  deckWidth: 92,
  startLanding: { x: 2656, y: 1054 },
  endLanding: { x: 2964, y: 1022 },
} as const satisfies CrystalBrookBridgeDefinition;

export const CRYSTAL_BROOK_ICE_BRIDGES = [
  CRYSTAL_BROOK_NORTH_BRIDGE,
  CRYSTAL_BROOK_EAST_BRIDGE,
] as const satisfies readonly CrystalBrookBridgeDefinition[];

export const CRYSTAL_BROOK_MAIN_ROUTE = [
  { x: 100, y: 1090 },
  { x: 850, y: 1090 },
  { x: 1510, y: 1260 },
  { x: 1980, y: 1320 },
  CRYSTAL_BROOK_NORTH_BRIDGE.startLanding,
  CRYSTAL_BROOK_NORTH_BRIDGE.endLanding,
  { x: 2510, y: 1060 },
  CRYSTAL_BROOK_EAST_BRIDGE.startLanding,
  CRYSTAL_BROOK_EAST_BRIDGE.endLanding,
  { x: 3070, y: 1110 },
  { x: 3125, y: 1270 },
  CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
  CRYSTAL_BROOK_WOODS_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION = { x: 2490, y: 1060 } as const;

export const CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS = [
  [
    { x: 100, y: 1090 },
    { x: 340, y: 1090 },
    { x: 620, y: 1160 },
    { x: 900, y: 1220 },
    { x: 1200, y: 1280 },
    { x: 1510, y: 1340 },
    { x: 1820, y: 1335 },
    { x: 2070, y: 1350 },
    CRYSTAL_BROOK_NORTH_BRIDGE.startLanding,
  ],
  [
    CRYSTAL_BROOK_NORTH_BRIDGE.endLanding,
    CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION,
    CRYSTAL_BROOK_EAST_BRIDGE.startLanding,
  ],
  [
    CRYSTAL_BROOK_EAST_BRIDGE.endLanding,
    { x: 3060, y: 1090 },
    { x: 3120, y: 1230 },
    { x: 3150, y: 1370 },
    CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
    CRYSTAL_BROOK_WOODS_THRESHOLD.position,
  ],
] as const satisfies readonly (readonly MapPoint[])[];

export const CRYSTAL_BROOK_WOODS_ROUTE = [
  CRYSTAL_BROOK_EAST_BRIDGE.endLanding,
  { x: 3060, y: 1090 },
  { x: 3120, y: 1230 },
  { x: 3150, y: 1370 },
  CRYSTAL_BROOK_WOODS_THRESHOLD.approach,
  CRYSTAL_BROOK_WOODS_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE = [
  CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION,
  { x: 2510, y: 930 },
  { x: 2580, y: 760 },
  { x: 2700, y: 590 },
  { x: 2810, y: 430 },
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.approach,
  CRYSTAL_BROOK_CRYSTAL_CUP_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE = CRYSTAL_BROOK_CRYSTAL_CUP_ROUTE;

export const CRYSTAL_BROOK_GROTTO_ROUTE = [
  { x: 2340, y: 1510 },
  { x: 2380, y: 1640 },
  { x: 2420, y: 1770 },
  CRYSTAL_BROOK_GROTTO_THRESHOLD.approach,
  CRYSTAL_BROOK_GROTTO_THRESHOLD.position,
] as const;

export const CRYSTAL_BROOK_UPPER_POOL = { x: 1370, y: 540 } as const;
export const CRYSTAL_BROOK_LOWER_POOL = { x: 2740, y: 1280 } as const;
export const CRYSTAL_BROOK_UPSTREAM_CASCADE = { x: 3320, y: 790 } as const;
export const CRYSTAL_BROOK_MEADOW_WATER_EXIT = { x: 120, y: 920 } as const;

export const CRYSTAL_BROOK_MEADOW_GORGE = {
  recess: { x: 82, y: 1008, width: 270, height: 438 },
  waterOpening: CRYSTAL_BROOK_MEADOW_WATER_EXIT,
  pathOpening: CRYSTAL_BROOK_MEADOW_THRESHOLD.position,
  pathApproach: CRYSTAL_BROOK_MEADOW_THRESHOLD.approach,
  pathFloor: [
    { x: -90, y: 1090 },
    { x: 90, y: 1090 },
    CRYSTAL_BROOK_MEADOW_THRESHOLD.position,
    CRYSTAL_BROOK_MEADOW_THRESHOLD.approach,
  ] as const satisfies readonly MapPoint[],
  waterThroat: {
    centre: CRYSTAL_BROOK_MEADOW_WATER_EXIT,
    width: 172,
    height: 104,
  },
  rockFaces: [
    { id: 'north-cap', x: 104, y: 744, width: 378, height: 224, angle: -8, colour: 0x617570 },
    { id: 'north-shoulder', x: 220, y: 838, width: 254, height: 146, angle: 6, colour: 0x71847d },
    { id: 'inner-divider', x: 206, y: 1014, width: 210, height: 82, angle: -4, colour: 0x667a75 },
    { id: 'south-shoulder', x: 192, y: 1214, width: 306, height: 190, angle: -5, colour: 0x697c77 },
    { id: 'south-cap', x: 80, y: 1390, width: 386, height: 242, angle: 8, colour: 0x5b706e },
  ],
  crystals: [
    { x: 238, y: 790, scale: 0.68, colour: 0xa4e9ed },
    { x: 250, y: 1260, scale: 0.56, colour: 0xc8baf0 },
  ],
  mist: [
    { x: 120, y: 904, width: 116, height: 30 },
    { x: 72, y: 930, width: 92, height: 24 },
  ],
} as const;

export const CRYSTAL_BROOK_WATERCOURSE = [
  { x: 3610, y: 760, outerWidth: 148, innerWidth: 106, deepWidth: 38 },
  { x: 3460, y: 755, outerWidth: 154, innerWidth: 110, deepWidth: 40 },
  { x: 3320, y: 790, outerWidth: 166, innerWidth: 118, deepWidth: 42 },
  { x: 3200, y: 840, outerWidth: 174, innerWidth: 124, deepWidth: 44 },
  { x: 3090, y: 885, outerWidth: 170, innerWidth: 122, deepWidth: 44 },
  { x: 2990, y: 910, outerWidth: 168, innerWidth: 120, deepWidth: 42 },
  { x: 2890, y: 940, outerWidth: 170, innerWidth: 122, deepWidth: 42 },
  { x: 2820, y: 1010, outerWidth: 176, innerWidth: 126, deepWidth: 44 },
  { x: 2790, y: 1110, outerWidth: 184, innerWidth: 132, deepWidth: 46 },
  { x: 2810, y: 1210, outerWidth: 194, innerWidth: 140, deepWidth: 50 },
  { x: 2740, y: 1280, outerWidth: 210, innerWidth: 150, deepWidth: 56 },
  { x: 2600, y: 1320, outerWidth: 198, innerWidth: 142, deepWidth: 52 },
  { x: 2440, y: 1290, outerWidth: 184, innerWidth: 132, deepWidth: 48 },
  { x: 2320, y: 1215, outerWidth: 178, innerWidth: 128, deepWidth: 46 },
  { x: 2200, y: 1150, outerWidth: 170, innerWidth: 122, deepWidth: 44 },
  { x: 2070, y: 1125, outerWidth: 164, innerWidth: 118, deepWidth: 42 },
  { x: 1940, y: 1095, outerWidth: 160, innerWidth: 116, deepWidth: 42 },
  { x: 1810, y: 1040, outerWidth: 162, innerWidth: 118, deepWidth: 42 },
  { x: 1690, y: 950, outerWidth: 172, innerWidth: 124, deepWidth: 46 },
  { x: 1600, y: 900, outerWidth: 182, innerWidth: 132, deepWidth: 48 },
  { x: 1470, y: 760, outerWidth: 224, innerWidth: 164, deepWidth: 66 },
  { x: 1370, y: 540, outerWidth: 390, innerWidth: 284, deepWidth: 120 },
  { x: 1260, y: 650, outerWidth: 268, innerWidth: 194, deepWidth: 78 },
  { x: 1190, y: 760, outerWidth: 205, innerWidth: 148, deepWidth: 54 },
  { x: 1110, y: 880, outerWidth: 182, innerWidth: 132, deepWidth: 46 },
  { x: 1030, y: 990, outerWidth: 170, innerWidth: 122, deepWidth: 44 },
  { x: 900, y: 1030, outerWidth: 158, innerWidth: 114, deepWidth: 40 },
  { x: 760, y: 1040, outerWidth: 150, innerWidth: 108, deepWidth: 38 },
  { x: 640, y: 1030, outerWidth: 146, innerWidth: 104, deepWidth: 36 },
  { x: 520, y: 1010, outerWidth: 142, innerWidth: 102, deepWidth: 36 },
  { x: 410, y: 985, outerWidth: 140, innerWidth: 100, deepWidth: 36 },
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
  { x: 3360, y: 770, width: 74, angle: -5 },
  { x: 2810, y: 1070, width: 86, angle: -82 },
  { x: 2360, y: 1240, width: 78, angle: 22 },
  { x: 1810, y: 1020, width: 76, angle: 18 },
  { x: 1380, y: 590, width: 118, angle: -5 },
  { x: 990, y: 975, width: 72, angle: -12 },
  { x: 470, y: 995, width: 82, angle: -10 },
  { x: 2260, y: 1550, width: 46, angle: -26 },
] as const;

export const CRYSTAL_BROOK_RIPPLE_OVERLOOK = { x: 1720, y: 830 } as const;
export const CRYSTAL_BROOK_ECHO_CLUE = { x: 2800, y: 1400 } as const;
export const CRYSTAL_BROOK_WATERFALL_MIST = { x: 3320, y: 845 } as const;
export const CRYSTAL_BROOK_WATERFALL_PRESENTATION = { x: 3320, y: 770 } as const;
export const CRYSTAL_BROOK_REFLECTION_POOL = { x: 2150, y: 1650 } as const;
export const CRYSTAL_BROOK_STEPPING_CHIME = { x: 1125, y: 970 } as const;
export const CRYSTAL_BROOK_SHALLOW_RIPPLE = { x: 1900, y: 1110 } as const;
export const CRYSTAL_BROOK_SINGING_CRYSTALS = { x: 2440, y: 1110 } as const;
export const CRYSTAL_BROOK_SHELL_SPARKLE = { x: 1760, y: 980 } as const;
export const CRYSTAL_BROOK_PEBBLE_STACK = { x: 1160, y: 1290 } as const;
export const CRYSTAL_BROOK_CASCADE_MEMORY = { x: 2660, y: 1160 } as const;

export const CRYSTAL_BROOK_SHALLOW_STREAM_HINT = { x: 1640, y: 960 } as const;
export const CRYSTAL_BROOK_GROTTO_CUE = { x: 2400, y: 1690 } as const;
export const CRYSTAL_BROOK_ECHO_WAYPOINTS = [
  { id: 'echo-brook-a', x: 2860, y: 1690, pauseMs: 2200 },
  { id: 'echo-brook-b', x: 2990, y: 1760, pauseMs: 2800 },
  { id: 'echo-brook-c', x: 3180, y: 1650, pauseMs: 2100 },
] as const;

export const CRYSTAL_BROOK_DISTRICTS = [
  { id: 'meadow-gorge', centre: { x: 430, y: 1090 }, radiusX: 430, radiusY: 390 },
  { id: 'central-brook', centre: { x: 1770, y: 1120 }, radiusX: 980, radiusY: 620 },
  { id: 'upstream-cascade', centre: { x: 3180, y: 870 }, radiusX: 500, radiusY: 440 },
  { id: 'grotto-bank', centre: { x: 2440, y: 1840 }, radiusX: 430, radiusY: 330 },
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
    { id: 'collision:brook-lower-deep-water', x: 2740, y: 1280, width: 180, height: 76 },
    { id: 'collision:cliff-west', x: 520, y: 410, width: 320, height: 150 },
    { id: 'collision:cliff-north-west', x: 880, y: 350, width: 260, height: 135 },
    { id: 'collision:cliff-north-east', x: 2350, y: 310, width: 300, height: 150 },
    { id: 'collision:cliff-east', x: 3190, y: 520, width: 300, height: 170 },
    { id: 'collision:north-crystal-bank', x: 2470, y: 505, width: 230, height: 125 },
    { id: 'collision:south-reed-bank', x: 1890, y: 1770, width: 230, height: 115 },
    { id: 'collision:brook-upstream-cascade', x: 3320, y: 790, width: 120, height: 170 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type CrystalBrookMap = typeof CRYSTAL_BROOK_MAP;
