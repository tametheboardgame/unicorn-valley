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

const DEFAULT_PLAYER_SPAWN = { x: 330, y: 1050 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setRainbowMeadowPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
  if (point.x === 330 && point.y === 1050) {
    setWorldArrivalFacing('RainbowMeadowScene', 'right');
  }
}

export function resetRainbowMeadowPlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const RAINBOW_MEADOW_MAP = {
  width: 3400,
  height: 2100,
  margin: 90,
  playerSpawn,
  raceHub: {
    x: 2670,
    y: 1080,
    width: 1180,
    height: 1120,
  },
  entrances: [
    {
      id: 'sunbeam-village',
      label: 'Sunbeam Village',
      position: { x: 120, y: 1050 },
      approach: { x: 330, y: 1050 },
      direction: 'west',
    },
  ] satisfies readonly MeadowEntrance[],
  hubFeatures: [
    {
      id: 'rainbow-run-entrance',
      label: 'Rainbow Run',
      position: { x: 3190, y: 1040 },
      approach: { x: 2970, y: 1040 },
    },
    {
      id: 'ribbon-board',
      label: 'Ribbon Board',
      position: { x: 2510, y: 1430 },
      approach: { x: 2510, y: 1260 },
    },
  ] satisfies readonly MeadowHubFeature[],
  npcMarkers: [
    {
      id: 'nova',
      label: 'Nova',
      position: { x: 2470, y: 930 },
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
    { id: 'collision:hub-tent', x: 2600, y: 520, width: 430, height: 260 },
    { id: 'collision:ribbon-board', x: 2510, y: 1430, width: 300, height: 85 },
    { id: 'collision:race-post-north', x: 3190, y: 900, width: 70, height: 180 },
    { id: 'collision:race-post-south', x: 3190, y: 1180, width: 70, height: 180 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type RainbowMeadowMap = typeof RAINBOW_MEADOW_MAP;
