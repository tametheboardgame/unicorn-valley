import type { DiscoveryId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { setWorldArrivalFacing } from './WorldArrivalState';

export const RAINBOW_MEADOW_LOCATION_ID = 'location:rainbow-meadow';

export interface MeadowEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west';
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
      centre: { x: 1450, y: 580 },
      radiusX: 960,
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
      centre: { x: 2700, y: 1010 },
      radiusX: 610,
      radiusY: 520,
      groundColour: 0xd5eca2,
      groundAlpha: 0.28,
    },
    {
      id: 'crystal-brook-corridor',
      centre: { x: 2980, y: 1780 },
      radiusX: 350,
      radiusY: 220,
      groundColour: 0xa8ddb7,
      groundAlpha: 0.25,
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
    flowerCircle: { x: 500, y: 650 },
    butterflyParade: { x: 780, y: 800 },
    petalPatch: { x: 1030, y: 650 },
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
      { id: 'north-east-a', x: 2050, y: 320, scale: 1 },
      { id: 'north-east-b', x: 2250, y: 430, scale: 1.05 },
      { id: 'far-east', x: 3000, y: 330, scale: 0.95 },
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
      { x: 2240, y: 740 },
      { x: 3040, y: 650 },
      { x: 3220, y: 800 },
    ],
    productionFlowerClusters: [
      { x: 390, y: 510, colour: 0xef93b8 },
      { x: 690, y: 470, colour: 0xf2c469 },
      { x: 930, y: 530, colour: 0x8acbda },
      { x: 1160, y: 860, colour: 0xc49ee0 },
      { x: 3050, y: 690, colour: 0xc49ee0 },
      { x: 3210, y: 760, colour: 0xf1a2bb },
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
  raceHub: {
    x: 2670,
    y: 1080,
    width: 1180,
    height: 1120,
  },
  hubFeatures: {
    rainbowRunEntrance: {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run',
      position: { x: 3190, y: 1040 },
      approach: { x: 2970, y: 1040 },
    },
    ribbonBoard: {
      id: 'ribbon-board',
      label: 'Ribbon Board',
      position: { x: 2510, y: 1430 },
      approach: { x: 2510, y: 1590 },
    },
    windmillLookout: {
      id: 'windmill-lookout',
      label: 'Windmill Lookout',
      position: { x: 1280, y: 275 },
      approach: { x: 1280, y: 440 },
    },
  },
  coreNpcPositions: {
    novaRaceHub: { x: 2470, y: 930 },
  },
  structuralPaths: [
    {
      id: 'main-route',
      points: [
        { x: 100, y: 1050 },
        { x: 760, y: 1050 },
        { x: 1330, y: 1110 },
        { x: 1900, y: 1040 },
        { x: 2350, y: 1050 },
        { x: 3190, y: 1040 },
      ],
      outerWidth: 148,
      innerWidth: 108,
    },
    {
      id: 'windmill-spur',
      points: [
        { x: 1110, y: 1065 },
        { x: 1190, y: 610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      id: 'picnic-spur',
      points: [
        { x: 1800, y: 1050 },
        { x: 1850, y: 1610 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
    {
      id: 'rainbow-run-hub-spur',
      points: [
        { x: 2500, y: 1060 },
        { x: 2510, y: 1260 },
      ],
      outerWidth: 76,
      innerWidth: 58,
    },
  ] satisfies readonly RainbowMeadowPathStroke[],
  // H4.4 owns canonicalising the functional Crystal Brook transition.
  // H4.1 retains these coordinates only as planning data for the later rebuild.
  crystalBrookRoute: {
    transitionPosition: { x: 3030, y: 1750 },
    pathPoints: [
      { x: 1900, y: 1040 },
      { x: 1970, y: 1220 },
      { x: 2050, y: 1420 },
      { x: 2170, y: 1580 },
      { x: 2320, y: 1720 },
      { x: 2490, y: 1840 },
      { x: 2760, y: 1870 },
      { x: 3030, y: 1750 },
    ] satisfies readonly MapPoint[],
  },
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
  entrances: [RAINBOW_MEADOW_LAYOUT.sunbeamGateway] satisfies readonly MeadowEntrance[],
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
    { id: 'collision:north-east-grove', x: 2160, y: 360, width: 430, height: 240 },
    { id: 'collision:far-east-tree', x: 3000, y: 330, width: 170, height: 190 },
    { id: 'collision:sports-east-frame', x: 1260, y: 1980, width: 170, height: 100 },
    {
      id: 'collision:windmill-lookout-base',
      x: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.x,
      y: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.position.y,
      width: 190,
      height: 255,
    },
    { id: 'collision:hub-tent', x: 2600, y: 520, width: 430, height: 260 },
    { id: 'collision:ribbon-board', x: 2510, y: 1430, width: 300, height: 85 },
    { id: 'collision:race-post-north', x: 3190, y: 900, width: 70, height: 180 },
    { id: 'collision:race-post-south', x: 3190, y: 1180, width: 70, height: 180 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type RainbowMeadowMap = typeof RAINBOW_MEADOW_MAP;
