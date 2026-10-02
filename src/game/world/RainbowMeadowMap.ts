import type { DiscoveryId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { setWorldArrivalFacing } from './WorldArrivalState';

export const RAINBOW_MEADOW_LOCATION_ID = 'location:rainbow-meadow';

export interface MeadowEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west' | 'east';
}

export interface MeadowHubFeature {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export interface MeadowDiscoverySpot {
  id: string;
  discoveryId: DiscoveryId;
  label: string;
  position: MapPoint;
  collectionRadius: number;
}

export interface RainbowMeadowPathStroke {
  id: string;
  points: readonly MapPoint[];
  outerWidth: number;
  innerWidth: number;
}

export const RAINBOW_MEADOW_LAYOUT = {
  bounds: {
    width: 3400,
    height: 2100,
    margin: 90,
  },
  // H4.2 owns these broad composition zones. Later slices may refine local presentation,
  // but they should preserve the reserved movement/activity space established here.
  districts: [
    {
      id: 'sunbeam-arrival',
      centre: { x: 430, y: 1050 },
      radiusX: 430,
      radiusY: 330,
      groundColour: 0xb9eaa2,
      groundAlpha: 0.3,
    },
    {
      id: 'north-nature',
      centre: { x: 1420, y: 580 },
      radiusX: 900,
      radiusY: 460,
      groundColour: 0xc5eda8,
      groundAlpha: 0.34,
    },
    {
      id: 'rainbow-disc-lawn',
      centre: { x: 700, y: 1640 },
      radiusX: 500,
      radiusY: 300,
      groundColour: 0x95d987,
      groundAlpha: 0.27,
    },
    {
      id: 'picnic-hill-reserve',
      centre: { x: 1740, y: 1660 },
      radiusX: 430,
      radiusY: 280,
      groundColour: 0xb8e69a,
      groundAlpha: 0.24,
    },
    {
      id: 'rainbow-run',
      centre: { x: 2950, y: 290 },
      radiusX: 330,
      radiusY: 210,
      groundColour: 0xd5eca2,
      groundAlpha: 0.12,
    },
    {
      id: 'crystal-brook-corridor',
      centre: { x: 3020, y: 1170 },
      radiusX: 450,
      radiusY: 360,
      groundColour: 0xa8ddb7,
      groundAlpha: 0.18,
    },
  ],
  natureFeatures: {
    windmill: {
      position: { x: 1280, y: 275 },
      storyPosition: { x: 1130, y: 465 },
      bellPosition: { x: 1280, y: 435 },
      lookoutPosition: { x: 1395, y: 425 },
    },
    pond: {
      position: { x: 1570, y: 610 },
      width: 500,
      height: 300,
      interactionPosition: { x: 1570, y: 710 },
      lilyPads: [
        { x: 1430, y: 560 },
        { x: 1540, y: 660 },
        { x: 1680, y: 570 },
      ],
    },
    flowerCircle: { x: 550, y: 600 },
    butterflyParade: { x: 780, y: 850 },
    petalPatch: { x: 1070, y: 760 },
  },
  discoveryPositions: {
    prismBloom: { x: 1260, y: 790 },
    sunshowerFeather: { x: 2050, y: 760 },
  },
  scenery: {
    trees: [
      { id: 'north-west-a', x: 250, y: 430, scale: 0.95 },
      { id: 'north-west-b', x: 480, y: 300, scale: 1.05 },
      { id: 'north-west-c', x: 720, y: 390, scale: 1 },
      { id: 'north-east-a', x: 1840, y: 320, scale: 1 },
      { id: 'north-east-b', x: 1950, y: 420, scale: 1.05 },
      { id: 'sports-west-frame', x: 120, y: 1900, scale: 1.05 },
      { id: 'sports-east-frame', x: 1260, y: 1980, scale: 1 },
    ],
    flowerClusters: [
      { x: 360, y: 540 },
      { x: 690, y: 520 },
      { x: 980, y: 500 },
      { x: 1160, y: 850 },
      { x: 1360, y: 850 },
      { x: 1900, y: 800 },
      { x: 2050, y: 760 },
    ],
    productionFlowerClusters: [
      { x: 390, y: 510, colour: 0xef93b8 },
      { x: 690, y: 470, colour: 0xf2c469 },
      { x: 930, y: 530, colour: 0x8acbda },
      { x: 1160, y: 860, colour: 0xc49ee0 },
    ],
    productionLeafClusters: [{ x: 120, y: 1540, mirrored: false }],
  },
  sunbeamGateway: {
    id: 'sunbeam-village',
    label: 'Sunbeam Village',
    position: { x: 120, y: 1050 },
    approach: { x: 330, y: 1050 },
    direction: 'west',
  },
  crystalBrookGateway: {
    id: 'crystal-brook',
    label: 'Crystal Brook',
    position: { x: 3300, y: 1035 },
    approach: { x: 3150, y: 1100 },
    direction: 'east',
  },
  // H4.4C: shallow wading rim, blocked deep water, stone crossing, continuous outflow and reactive falls.
  crystalBrookGatewayArea: {
    dryLanding: { x: 2680, y: 1210 },
    sign: { x: 2520, y: 1325 },
    leftBank: { x: 2670, y: 1210 },
    pool: {
      centre: { x: 3030, y: 1190 },
      shoreline: [
        { x: 2655, y: 1190 },
        { x: 2690, y: 1060 },
        { x: 2800, y: 970 },
        { x: 2940, y: 925 },
        { x: 3090, y: 940 },
        { x: 3225, y: 985 },
        { x: 3330, y: 1070 },
        { x: 3370, y: 1185 },
        { x: 3340, y: 1305 },
        { x: 3240, y: 1400 },
        { x: 3140, y: 1450 },
        { x: 3090, y: 1495 },
        { x: 3030, y: 1495 },
        { x: 2960, y: 1450 },
        { x: 2805, y: 1385 },
        { x: 2700, y: 1300 },
      ],
      deepZone: [
        { x: 2790, y: 1150 },
        { x: 2840, y: 1050 },
        { x: 2950, y: 995 },
        { x: 3070, y: 1000 },
        { x: 3190, y: 1040 },
        { x: 3280, y: 1120 },
        { x: 3300, y: 1230 },
        { x: 3230, y: 1330 },
        { x: 3140, y: 1395 },
        { x: 3070, y: 1480 },
        { x: 3015, y: 1450 },
        { x: 2965, y: 1385 },
        { x: 2860, y: 1315 },
        { x: 2800, y: 1240 },
      ],
    },
    waterfall: {
      x: 3340,
      y: 1010,
      width: 146,
      height: 320,
      openRadius: 255,
      curtains: [
        { id: 'outer-left', side: -1, closedOffset: 50, openOffset: 118, width: 44 },
        { id: 'inner-left', side: -1, closedOffset: 16, openOffset: 70, width: 46 },
        { id: 'inner-right', side: 1, closedOffset: 16, openOffset: 70, width: 46 },
        { id: 'outer-right', side: 1, closedOffset: 50, openOffset: 118, width: 44 },
      ],
    },
    steppingStones: [
      { x: 2745, y: 1210, width: 112, height: 66, angle: -7 },
      { x: 2855, y: 1185, width: 120, height: 68, angle: 5 },
      { x: 2965, y: 1150, width: 116, height: 64, angle: -4 },
      { x: 3070, y: 1120, width: 112, height: 62, angle: 5 },
      { x: 3170, y: 1085, width: 104, height: 58, angle: -5 },
      { x: 3250, y: 1050, width: 96, height: 54, angle: 4 },
    ],
    rocks: [
      {
        x: 2750,
        y: 985,
        width: 188,
        height: 70,
        collisionWidth: 134,
        collisionHeight: 46,
        colour: 0x70807d,
        kind: 'slab',
        angle: -8,
      },
      {
        x: 2965,
        y: 860,
        width: 92,
        height: 168,
        collisionWidth: 64,
        collisionHeight: 108,
        colour: 0x627673,
        kind: 'spire',
        angle: 5,
      },
      {
        x: 3070,
        y: 900,
        width: 112,
        height: 102,
        collisionWidth: 76,
        collisionHeight: 68,
        colour: 0x75837d,
        kind: 'round',
        angle: -3,
      },
      {
        x: 3290,
        y: 1270,
        width: 150,
        height: 112,
        collisionWidth: 40,
        collisionHeight: 68,
        colour: 0x586d6d,
        kind: 'wedge',
        angle: 8,
      },
      {
        x: 3250,
        y: 1460,
        width: 188,
        height: 112,
        collisionWidth: 120,
        collisionHeight: 68,
        colour: 0x5f7271,
        kind: 'cluster',
        angle: -4,
      },
      {
        x: 2980,
        y: 1510,
        width: 196,
        height: 76,
        collisionWidth: 140,
        collisionHeight: 48,
        colour: 0x637573,
        kind: 'slab',
        angle: 4,
      },
      {
        x: 2760,
        y: 1420,
        width: 158,
        height: 112,
        collisionWidth: 108,
        collisionHeight: 66,
        colour: 0x687976,
        kind: 'lopsided',
        angle: -10,
      },
    ],
    crystals: [
      { x: 2870, y: 990, scale: 0.56 },
      { x: 3140, y: 1410, scale: 0.68 },
      { x: 3265, y: 930, scale: 0.82 },
      { x: 3310, y: 1330, scale: 0.64 },
    ],
    mist: [
      { x: 3275, y: 1080, width: 180, height: 52 },
      { x: 3340, y: 1130, width: 230, height: 68 },
      { x: 3220, y: 1165, width: 170, height: 48 },
    ],
    outletStream: {
      outerWidth: 126,
      innerWidth: 88,
      deepWidth: 58,
      points: [
        { x: 3060, y: 1450 },
        { x: 3050, y: 1530 },
        { x: 3115, y: 1650 },
        { x: 3035, y: 1775 },
        { x: 3090, y: 1900 },
        { x: 3015, y: 2035 },
        { x: 2980, y: 2190 },
      ],
    },
    deepWaterBlockers: [
      { x: 2820, y: 1030, width: 180, height: 80 },
      { x: 2820, y: 1360, width: 180, height: 140 },
      { x: 3000, y: 980, width: 180, height: 80 },
      { x: 3000, y: 1320, width: 180, height: 160 },
      { x: 3160, y: 930, width: 180, height: 70 },
      { x: 3160, y: 1270, width: 180, height: 180 },
      { x: 3280, y: 1220, width: 60, height: 140 },
    ],
  },
  hubFeatures: {
    rainbowRunEntrance: {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run Race Hub',
      position: { x: 2950, y: 190 },
      approach: { x: 2950, y: 390 },
    },
    windmillLookout: {
      id: 'windmill-lookout',
      label: 'Windmill Lookout',
      position: { x: 1280, y: 275 },
      approach: { x: 1280, y: 440 },
    },
  },
  structuralPaths: [
    {
      id: 'main-route',
      points: [
        { x: -180, y: 1050 },
        { x: 120, y: 1050 },
        { x: 330, y: 1050 },
        { x: 760, y: 1050 },
        { x: 1180, y: 1085 },
        { x: 1500, y: 1100 },
        { x: 1900, y: 1040 },
        { x: 2250, y: 1050 },
      ],
      outerWidth: 150,
      innerWidth: 108,
    },
    {
      id: 'windmill-spur',
      points: [
        { x: 1120, y: 1080 },
        { x: 1160, y: 850 },
        { x: 1215, y: 610 },
        { x: 1280, y: 440 },
      ],
      outerWidth: 76,
      innerWidth: 56,
    },
    {
      id: 'nature-spur',
      points: [
        { x: 1450, y: 1095 },
        { x: 1495, y: 920 },
        { x: 1540, y: 790 },
        { x: 1570, y: 710 },
      ],
      outerWidth: 70,
      innerWidth: 50,
    },
    {
      id: 'picnic-spur',
      points: [
        { x: 1820, y: 1048 },
        { x: 1800, y: 1220 },
        { x: 1770, y: 1390 },
        { x: 1740, y: 1510 },
      ],
      outerWidth: 76,
      innerWidth: 56,
    },
    {
      id: 'rainbow-disc-spur',
      points: [
        { x: 760, y: 1050 },
        { x: 740, y: 1200 },
        { x: 720, y: 1320 },
        { x: 700, y: 1400 },
      ],
      outerWidth: 72,
      innerWidth: 52,
    },
    {
      id: 'rainbow-run-hub-spur',
      points: [
        { x: 2250, y: 1050 },
        { x: 2330, y: 870 },
        { x: 2460, y: 700 },
        { x: 2670, y: 540 },
        { x: 2950, y: 390 },
        { x: 2950, y: 120 },
      ],
      outerWidth: 78,
      innerWidth: 58,
    },
    {
      id: 'crystal-brook-spur',
      points: [
        { x: 2250, y: 1050 },
        { x: 2410, y: 1100 },
        { x: 2540, y: 1165 },
        { x: 2680, y: 1210 },
      ],
      outerWidth: 110,
      innerWidth: 78,
    },
  ] satisfies readonly RainbowMeadowPathStroke[],
} as const;

const DEFAULT_PLAYER_SPAWN = RAINBOW_MEADOW_LAYOUT.sunbeamGateway.approach;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setRainbowMeadowPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
  if (point.x === DEFAULT_PLAYER_SPAWN.x && point.y === DEFAULT_PLAYER_SPAWN.y) {
    setWorldArrivalFacing('RainbowMeadowScene', 'right');
  }
}

export function resetRainbowMeadowPlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const RAINBOW_MEADOW_MAP = {
  width: RAINBOW_MEADOW_LAYOUT.bounds.width,
  height: RAINBOW_MEADOW_LAYOUT.bounds.height,
  margin: RAINBOW_MEADOW_LAYOUT.bounds.margin,
  playerSpawn,
  entrances: [
    RAINBOW_MEADOW_LAYOUT.sunbeamGateway,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway,
  ] satisfies readonly MeadowEntrance[],
  hubFeatures: [
    RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance,
    RAINBOW_MEADOW_LAYOUT.hubFeatures.windmillLookout,
  ] satisfies readonly MeadowHubFeature[],
  discoverySpots: [
    {
      id: 'prism-bloom',
      discoveryId: 'discovery:prism-bloom',
      label: 'Prism Bloom',
      position: RAINBOW_MEADOW_LAYOUT.discoveryPositions.prismBloom,
      collectionRadius: 72,
    },
    {
      id: 'sunshower-feather',
      discoveryId: 'discovery:sunshower-feather',
      label: 'Sunshower Feather',
      position: RAINBOW_MEADOW_LAYOUT.discoveryPositions.sunshowerFeather,
      collectionRadius: 72,
    },
  ] satisfies readonly MeadowDiscoverySpot[],
  colliders: [
    {
      id: 'collision:rainbow-pond',
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.position.y,
      width: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.width,
      height: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.height,
    },
    { id: 'collision:north-west-grove', x: 490, y: 360, width: 620, height: 260 },
    { id: 'collision:north-east-grove', x: 1900, y: 365, width: 310, height: 220 },
    { id: 'collision:sports-east-frame', x: 1260, y: 1980, width: 170, height: 100 },
    {
      id: 'collision:windmill-lookout-base',
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.y,
      width: 190,
      height: 255,
    },
    {
      id: 'collision:race-hub-gateway-west-post',
      x: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.x - 100,
      y: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.y,
      width: 38,
      height: 190,
    },
    {
      id: 'collision:race-hub-gateway-east-post',
      x: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.x + 100,
      y: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.y,
      width: 38,
      height: 190,
    },
    ...RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.map((rock, index) => ({
      id: `collision:crystal-brook-gateway-rock:${index}`,
      x: rock.x,
      y: rock.y,
      width: rock.collisionWidth,
      height: rock.collisionHeight,
    })),
    ...RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.deepWaterBlockers.map((blocker, index) => ({
      id: `collision:crystal-brook-deep-water:${index}`,
      ...blocker,
    })),
  ] satisfies readonly CollisionRectangle[],
} as const;

export type RainbowMeadowMap = typeof RAINBOW_MEADOW_MAP;
