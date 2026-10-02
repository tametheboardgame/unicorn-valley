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

export interface MeadowNpcMarker {
  id: string;
  label: string;
  position: MapPoint;
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
      radiusX: 850,
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
      centre: { x: 2680, y: 650 },
      radiusX: 470,
      radiusY: 330,
      groundColour: 0xd5eca2,
      groundAlpha: 0.2,
    },
    {
      id: 'crystal-brook-corridor',
      centre: { x: 3020, y: 1690 },
      radiusX: 430,
      radiusY: 330,
      groundColour: 0xa8ddb7,
      groundAlpha: 0.2,
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
      { id: 'north-east-a', x: 1880, y: 320, scale: 1 },
      { id: 'north-east-b', x: 2100, y: 410, scale: 1.05 },
      { id: 'far-east', x: 3280, y: 360, scale: 0.95 },
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
    productionLeafClusters: [
      { x: 120, y: 1540, mirrored: false },
      { x: 3260, y: 420, mirrored: true },
    ],
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
    position: { x: 3300, y: 1580 },
    approach: { x: 3130, y: 1645 },
    direction: 'east',
  },
  // H4.4 hero composition: the Meadow road ends at the bank; water, stones and waterfall own the threshold.
  crystalBrookGatewayArea: {
    leftBank: { x: 2735, y: 1745 },
    pool: { x: 3040, y: 1735, width: 690, height: 390 },
    waterfall: { x: 3330, y: 1515, width: 180, height: 360 },
    steppingStones: [
      { x: 2795, y: 1755, width: 106, height: 60, angle: -5 },
      { x: 2895, y: 1725, width: 112, height: 62, angle: 4 },
      { x: 3000, y: 1690, width: 108, height: 60, angle: -3 },
      { x: 3105, y: 1655, width: 104, height: 58, angle: 5 },
      { x: 3205, y: 1620, width: 96, height: 54, angle: -4 },
    ],
    rocks: [
      {
        x: 2760,
        y: 1585,
        width: 138,
        height: 82,
        collisionWidth: 98,
        collisionHeight: 52,
        colour: 0x70807d,
      },
      {
        x: 2800,
        y: 1880,
        width: 150,
        height: 88,
        collisionWidth: 106,
        collisionHeight: 56,
        colour: 0x687976,
      },
      {
        x: 2980,
        y: 1535,
        width: 126,
        height: 74,
        collisionWidth: 90,
        collisionHeight: 48,
        colour: 0x637573,
      },
      {
        x: 3095,
        y: 1925,
        width: 142,
        height: 82,
        collisionWidth: 102,
        collisionHeight: 52,
        colour: 0x5f7271,
      },
      {
        x: 3260,
        y: 1815,
        width: 166,
        height: 98,
        collisionWidth: 118,
        collisionHeight: 62,
        colour: 0x586d6d,
      },
      {
        x: 3340,
        y: 1395,
        width: 190,
        height: 118,
        collisionWidth: 132,
        collisionHeight: 72,
        colour: 0x53696b,
      },
    ],
    crystals: [
      { x: 2940, y: 1575, scale: 0.58 },
      { x: 3160, y: 1855, scale: 0.68 },
      { x: 3270, y: 1465, scale: 0.82 },
      { x: 3330, y: 1715, scale: 0.66 },
    ],
    mist: [
      { x: 3265, y: 1600, width: 190, height: 56 },
      { x: 3330, y: 1650, width: 230, height: 68 },
      { x: 3210, y: 1690, width: 170, height: 48 },
    ],
  },
  raceHub: {
    x: 2680,
    y: 650,
    width: 820,
    height: 620,
  },
  raceHubPresentation: {
    tent: { x: 2480, y: 500 },
    title: { x: 2670, y: 285 },
    cupBoard: {
      position: { x: 2890, y: 650 },
      approach: { x: 2890, y: 820 },
    },
    runPoster: { x: 3050, y: 450 },
    ribbonEvidence: { x: 2495, y: 705 },
    flags: [
      { x: 2250, y: 555 },
      { x: 2290, y: 865 },
      { x: 3030, y: 570 },
      { x: 3040, y: 880 },
    ],
  },
  hubFeatures: {
    rainbowRunEntrance: {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run',
      position: { x: 3060, y: 1040 },
      approach: { x: 2890, y: 1040 },
    },
    ribbonBoard: {
      id: 'ribbon-board',
      label: 'Ribbon Board',
      position: { x: 2550, y: 760 },
      approach: { x: 2550, y: 930 },
    },
    windmillLookout: {
      id: 'windmill-lookout',
      label: 'Windmill Lookout',
      position: { x: 1280, y: 275 },
      approach: { x: 1280, y: 440 },
    },
  },
  coreNpcPositions: {
    novaRaceHub: { x: 2300, y: 720 },
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
        { x: 2350, y: 1050 },
        { x: 2800, y: 1040 },
        { x: 3060, y: 1040 },
        { x: 3560, y: 1040 },
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
        { x: 2660, y: 1045 },
        { x: 2630, y: 900 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      id: 'crystal-brook-spur',
      points: [
        { x: 2050, y: 1045 },
        { x: 2120, y: 1260 },
        { x: 2230, y: 1440 },
        { x: 2400, y: 1580 },
        { x: 2580, y: 1680 },
        { x: 2735, y: 1745 },
      ],
      outerWidth: 92,
      innerWidth: 64,
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
  raceHub: RAINBOW_MEADOW_LAYOUT.raceHub,
  entrances: [
    RAINBOW_MEADOW_LAYOUT.sunbeamGateway,
    RAINBOW_MEADOW_LAYOUT.crystalBrookGateway,
  ] satisfies readonly MeadowEntrance[],
  hubFeatures: [
    RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance,
    RAINBOW_MEADOW_LAYOUT.hubFeatures.ribbonBoard,
    RAINBOW_MEADOW_LAYOUT.hubFeatures.windmillLookout,
  ] satisfies readonly MeadowHubFeature[],
  npcMarkers: [
    {
      id: 'nova',
      label: 'Nova',
      position: RAINBOW_MEADOW_LAYOUT.coreNpcPositions.novaRaceHub,
    },
  ] satisfies readonly MeadowNpcMarker[],
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
    { id: 'collision:north-east-grove', x: 1990, y: 365, width: 390, height: 230 },
    { id: 'collision:far-east-tree', x: 3280, y: 360, width: 170, height: 190 },
    { id: 'collision:sports-east-frame', x: 1260, y: 1980, width: 170, height: 100 },
    {
      id: 'collision:windmill-lookout-base',
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.y,
      width: 190,
      height: 255,
    },
    {
      id: 'collision:hub-tent',
      x: RAINBOW_MEADOW_LAYOUT.raceHubPresentation.tent.x,
      y: RAINBOW_MEADOW_LAYOUT.raceHubPresentation.tent.y,
      width: 430,
      height: 260,
    },
    {
      id: 'collision:ribbon-board',
      x: RAINBOW_MEADOW_LAYOUT.hubFeatures.ribbonBoard.position.x,
      y: RAINBOW_MEADOW_LAYOUT.hubFeatures.ribbonBoard.position.y,
      width: 300,
      height: 85,
    },
    {
      id: 'collision:race-post-north',
      x: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.x,
      y: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.y - 140,
      width: 70,
      height: 180,
    },
    {
      id: 'collision:race-post-south',
      x: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.x,
      y: RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.y + 140,
      width: 70,
      height: 180,
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
