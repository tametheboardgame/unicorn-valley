import type { DiscoveryId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowLayout';
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
