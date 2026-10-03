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
      id: 'north-east-meadow',
      centre: { x: 2860, y: 420 },
      radiusX: 470,
      radiusY: 300,
      groundColour: 0xb8e3a0,
      groundAlpha: 0.18,
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
      position: { x: 1190, y: 300 },
      storyPosition: { x: 930, y: 530 },
      bellPosition: { x: 1045, y: 405 },
      lookoutPosition: { x: 1190, y: 470 },
    },
    pond: {
      position: { x: 1570, y: 610 },
      width: 500,
      height: 300,
      interactionPosition: { x: 1570, y: 830 },
      lilyPads: [
        { x: 1430, y: 560 },
        { x: 1540, y: 660 },
        { x: 1680, y: 570 },
      ],
      collisionSlices: [
        { id: 'top', offsetY: -116, width: 310, height: 34 },
        { id: 'upper', offsetY: -72, width: 425, height: 58 },
        { id: 'centre', offsetY: 0, width: 492, height: 92 },
        { id: 'lower', offsetY: 72, width: 425, height: 58 },
        { id: 'bottom', offsetY: 116, width: 310, height: 34 },
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
  picnicHill: {
    centre: { x: 1740, y: 1660 },
    approach: { x: 1740, y: 1510 },
    interactionPosition: { x: 1740, y: 1570 },
    hill: { width: 760, height: 360 },
    blanket: { x: 1740, y: 1685, width: 440, height: 210, angle: -4 },
    bunting: {
      leftPost: { x: 1515, y: 1545 },
      rightPost: { x: 1965, y: 1545 },
      lineY: 1500,
    },
    marigold: { x: 1540, y: 1740 },
    nova: { x: 1940, y: 1710 },
    mapleStorySpot: { x: 1885, y: 1575 },
    noFinishLineLandmark: { x: 1980, y: 1585 },
    mapleWaypoints: [
      { id: 'maple-picnic-a', x: 1585, y: 1785, pauseMs: 2600 },
      { id: 'maple-picnic-b', x: 1735, y: 1815, pauseMs: 3200 },
      { id: 'maple-picnic-c', x: 1900, y: 1775, pauseMs: 2300 },
    ],
    flowerPatches: [
      { x: 1435, y: 1625, colour: 0xf2b5ce },
      { x: 1495, y: 1845, colour: 0xffdf87 },
      { x: 2020, y: 1640, colour: 0xa9d8ea },
      { x: 1985, y: 1860, colour: 0xc8a8e5 },
      { x: 1700, y: 1935, colour: 0xf2b5ce },
    ],
    grassTufts: [
      { x: 1455, y: 1735 },
      { x: 1510, y: 1920 },
      { x: 2040, y: 1730 },
      { x: 1960, y: 1940 },
    ],
  },
  rainbowDisc: {
    centre: { x: 700, y: 1650 },
    approach: { x: 700, y: 1400 },
    field: { width: 860, height: 390 },
    captain: { x: 505, y: 1510 },
    sign: { x: 520, y: 1020 },
    players: [
      { id: 'captain', x: 505, y: 1510 },
      { id: 'player-a', x: 425, y: 1705 },
      { id: 'player-b', x: 625, y: 1600 },
      { id: 'player-c', x: 805, y: 1765 },
      { id: 'player-d', x: 980, y: 1580 },
    ],
    pennants: [
      { x: 285, y: 1500 },
      { x: 1115, y: 1500 },
      { x: 285, y: 1810 },
      { x: 1115, y: 1810 },
    ],
    practice: {
      centre: { x: 1040, y: 1305 },
      approach: { x: 1080, y: 1400 },
      sign: { x: 1040, y: 1165 },
      throwLine: { x: 840, y: 1305 },
      targetBaseY: 1410,
      targets: [
        { id: 'easy', x: 900, y: 1305, radius: 42 },
        { id: 'medium', x: 1050, y: 1305, radius: 34 },
        { id: 'hard', x: 1190, y: 1305, radius: 26 },
      ],
    },
  },
  boundaries: {
    hedges: [
      { id: 'west-north', x: 145, y: 430, width: 110, height: 560 },
      { id: 'west-south', x: 72, y: 1660, width: 110, height: 650 },
      { id: 'north-west', x: 680, y: 145, width: 980, height: 110 },
      { id: 'north-centre', x: 1770, y: 145, width: 920, height: 110 },
      { id: 'south-west', x: 650, y: 2025, width: 1050, height: 100 },
      { id: 'south-centre', x: 1960, y: 2025, width: 1120, height: 100 },
    ],
    raceFence: [
      { id: 'race-west', x1: 2240, y1: 160, x2: 2760, y2: 160 },
      { id: 'race-east', x1: 3130, y1: 160, x2: 3330, y2: 160 },
    ],
    crystalRocks: [
      {
        id: 'east-north-round',
        x: 3290,
        y: 320,
        width: 126,
        height: 94,
        collisionWidth: 96,
        collisionHeight: 68,
        kind: 'round',
      },
      {
        id: 'east-north-slab',
        x: 3315,
        y: 535,
        width: 164,
        height: 82,
        collisionWidth: 126,
        collisionHeight: 54,
        kind: 'slab',
      },
      {
        id: 'east-north-spire',
        x: 3295,
        y: 750,
        width: 104,
        height: 146,
        collisionWidth: 70,
        collisionHeight: 108,
        kind: 'spire',
      },
      {
        id: 'east-south-lopsided',
        x: 3320,
        y: 1640,
        width: 152,
        height: 108,
        collisionWidth: 112,
        collisionHeight: 72,
        kind: 'lopsided',
      },
      {
        id: 'east-south-slab',
        x: 3290,
        y: 1865,
        width: 188,
        height: 88,
        collisionWidth: 140,
        collisionHeight: 58,
        kind: 'slab',
      },
    ],
    wildflowerPockets: [
      { id: 'west-arrival', x: 245, y: 815, width: 170 },
      { id: 'north-nature', x: 2060, y: 245, width: 190 },
      { id: 'south-disc', x: 1220, y: 1940, width: 170 },
      { id: 'south-picnic', x: 2390, y: 1945, width: 190 },
    ],
  },
  scenery: {
    trees: [
      { id: 'north-west-a', x: 250, y: 430, scale: 0.95 },
      { id: 'north-west-b', x: 480, y: 300, scale: 1.05 },
      { id: 'north-west-c', x: 720, y: 390, scale: 1 },
      { id: 'north-east-a', x: 1840, y: 320, scale: 1 },
      { id: 'north-east-b', x: 1950, y: 420, scale: 1.05 },
      { id: 'race-reclaim-west', x: 2550, y: 315, scale: 0.88 },
      { id: 'race-reclaim-east', x: 3270, y: 390, scale: 0.82 },
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
      { x: 2525, y: 500 },
      { x: 3260, y: 560 },
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
  // H4.4 final: fully walkable basin, visual stone crossing, continuous outflow and reactive falls.
  crystalBrookGatewayArea: {
    dryLanding: { x: 2680, y: 1210 },
    sign: { x: 2445, y: 1245 },
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
        { x: 3123, y: 1495 },
        { x: 2997, y: 1495 },
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
        { x: 3090, y: 1495 },
        { x: 3030, y: 1495 },
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
        { x: 3060, y: 1495 },
        { x: 3060, y: 1560 },
        { x: 3115, y: 1650 },
        { x: 3035, y: 1775 },
        { x: 3090, y: 1900 },
        { x: 3015, y: 2035 },
        { x: 2980, y: 2190 },
      ],
    },
  },
  hubFeatures: {
    rainbowRunEntrance: {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run Race Hub',
      position: { x: 2950, y: 90 },
      approach: { x: 2950, y: 300 },
    },
    windmillLookout: {
      id: 'windmill-lookout',
      label: 'Windmill Lookout',
      position: { x: 1190, y: 300 },
      approach: { x: 1190, y: 525 },
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
        { x: 1140, y: 850 },
        { x: 1160, y: 650 },
        { x: 1190, y: 525 },
      ],
      outerWidth: 76,
      innerWidth: 56,
    },
    {
      id: 'nature-spur',
      points: [
        { x: 1450, y: 1095 },
        { x: 1495, y: 920 },
        { x: 1540, y: 850 },
        { x: 1570, y: 830 },
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
        { x: 2660, y: 540 },
        { x: 2820, y: 410 },
        { x: 2950, y: 300 },
        { x: 2950, y: 90 },
        { x: 2950, y: -140 },
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
    ...RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.collisionSlices.map((slice) => ({
      id: `collision:rainbow-pond:${slice.id}`,
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.position.y + slice.offsetY,
      width: slice.width,
      height: slice.height,
    })),
    ...RAINBOW_MEADOW_LAYOUT.scenery.trees.map((tree) => ({
      id: `collision:meadow-tree:${tree.id}`,
      x: tree.x,
      y: tree.y - 34 * tree.scale,
      width: 64 * tree.scale,
      height: 70 * tree.scale,
    })),
    ...RAINBOW_MEADOW_LAYOUT.boundaries.hedges.map((hedge) => {
      const horizontal = hedge.width >= hedge.height;
      return {
        id: `collision:meadow-boundary:hedge:${hedge.id}`,
        x: hedge.x,
        y: hedge.y,
        width: horizontal ? hedge.width : 62,
        height: horizontal ? 62 : hedge.height,
      };
    }),
    ...RAINBOW_MEADOW_LAYOUT.boundaries.raceFence.map((segment) => ({
      id: `collision:meadow-boundary:race-fence:${segment.id}`,
      x: (segment.x1 + segment.x2) / 2,
      y: (segment.y1 + segment.y2) / 2,
      width: Math.abs(segment.x2 - segment.x1),
      height: 30,
    })),
    ...RAINBOW_MEADOW_LAYOUT.boundaries.crystalRocks.map((rock) => ({
      id: `collision:meadow-boundary:crystal-rock:${rock.id}`,
      x: rock.x,
      y: rock.y,
      width: rock.collisionWidth,
      height: rock.collisionHeight,
    })),
    {
      id: 'collision:windmill-lookout-base',
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.y,
      width: 170,
      height: 250,
    },
    ...RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.map((rock, index) => ({
      id: `collision:crystal-brook-gateway-rock:${index}`,
      x: rock.x,
      y: rock.y,
      width: rock.collisionWidth,
      height: rock.collisionHeight,
    })),
  ] satisfies readonly CollisionRectangle[],
} as const;

export type RainbowMeadowMap = typeof RAINBOW_MEADOW_MAP;
