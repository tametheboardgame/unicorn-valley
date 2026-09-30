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
      position: { x: 1280, y: 270 },
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
      position: { x: 1190, y: 610 },
      collectionRadius: 72,
    },
    {
      id: 'sunshower-feather',
      discoveryId: 'discovery:sunshower-feather',
      label: 'Sunshower Feather',
      position: { x: 1850, y: 1610 },
      collectionRadius: 72,
    },
  ] satisfies readonly MeadowDiscoverySpot[],
  colliders: [
    { id: 'collision:rainbow-pond', x: 1570, y: 610, width: 500, height: 300 },
    { id: 'collision:north-grove', x: 720, y: 410, width: 360, height: 250 },
    { id: 'collision:south-grove', x: 1030, y: 1660, width: 420, height: 250 },
    { id: 'collision:windmill-lookout-base', x: 1280, y: 275, width: 190, height: 255 },
    { id: 'collision:hub-tent', x: 2600, y: 520, width: 430, height: 260 },
    { id: 'collision:ribbon-board', x: 2510, y: 1430, width: 300, height: 85 },
    { id: 'collision:race-post-north', x: 3190, y: 900, width: 70, height: 180 },
    { id: 'collision:race-post-south', x: 3190, y: 1180, width: 70, height: 180 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type RainbowMeadowMap = typeof RAINBOW_MEADOW_MAP;
