import type { DiscoveryId, ItemId } from '../../content/contentTypes';
import {
  MOONLIT_POINT_DISCOVERY_ID,
  MOON_SPECKLE_SHELL_DISCOVERY_ID,
  MOON_SPECKLE_SHELL_ITEM_ID,
  SHELL_COVE_DISCOVERY_ID,
  STAR_DUNES_DISCOVERY_ID,
  SUNRISE_SPIRAL_SHELL_DISCOVERY_ID,
  SUNRISE_SPIRAL_SHELL_ITEM_ID,
  TIDE_POOLS_DISCOVERY_ID,
  WAVE_FAN_SHELL_DISCOVERY_ID,
  WAVE_FAN_SHELL_ITEM_ID,
} from '../../content/r65StarlightBeach';
import type { CollisionRectangle, MapPoint } from './MapTraversal';

export const STARLIGHT_BEACH_LOCATION_ID = 'location:starlight-beach';

export interface BeachEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west';
}

export interface BeachLandmark {
  id: string;
  label: string;
  icon: string;
  position: MapPoint;
}

export interface BeachDiscoverySpot {
  id: string;
  discoveryId: DiscoveryId;
  label: string;
  icon: string;
  position: MapPoint;
  collectionRadius: number;
  itemId?: ItemId;
}

const DEFAULT_PLAYER_SPAWN = { x: 350, y: 1140 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setStarlightBeachPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetStarlightBeachPlayerSpawn(): void {
  setStarlightBeachPlayerSpawn(DEFAULT_PLAYER_SPAWN);
}

export const STARLIGHT_BEACH_MAP = {
  width: 3600,
  height: 2300,
  margin: 90,
  playerSpawn,
  entrances: [
    {
      id: 'whispering-woods',
      label: 'Whispering Woods',
      position: { x: 120, y: 1140 },
      approach: { x: 350, y: 1140 },
      direction: 'west',
    },
  ] satisfies readonly BeachEntrance[],
  landmarks: [
    { id: 'shell-cove', label: 'Shell Cove', icon: '🐚', position: { x: 820, y: 760 } },
    {
      id: 'driftwood-walk',
      label: 'Driftwood Walk',
      icon: '🪵',
      position: { x: 1420, y: 1120 },
    },
    {
      id: 'tide-pools',
      label: 'Tide Pools',
      icon: '🫧',
      position: { x: 1900, y: 1630 },
    },
    { id: 'star-dunes', label: 'Star Dunes', icon: '⛱️', position: { x: 2480, y: 760 } },
    {
      id: 'moonlit-point',
      label: 'Moonlit Point',
      icon: '🌙',
      position: { x: 3130, y: 1510 },
    },
  ] satisfies readonly BeachLandmark[],
  discoverySpots: [
    {
      id: 'shell-cove',
      discoveryId: SHELL_COVE_DISCOVERY_ID,
      label: 'Shell Cove',
      icon: '🐚',
      position: { x: 820, y: 760 },
      collectionRadius: 120,
    },
    {
      id: 'tide-pools',
      discoveryId: TIDE_POOLS_DISCOVERY_ID,
      label: 'Starlight Tide Pools',
      icon: '🫧',
      position: { x: 1900, y: 1630 },
      collectionRadius: 120,
    },
    {
      id: 'star-dunes',
      discoveryId: STAR_DUNES_DISCOVERY_ID,
      label: 'Star Dunes',
      icon: '⛱️',
      position: { x: 2480, y: 760 },
      collectionRadius: 130,
    },
    {
      id: 'moonlit-point',
      discoveryId: MOONLIT_POINT_DISCOVERY_ID,
      label: 'Moonlit Point',
      icon: '🌙',
      position: { x: 3130, y: 1510 },
      collectionRadius: 125,
    },
    {
      id: 'sunrise-spiral-shell',
      discoveryId: SUNRISE_SPIRAL_SHELL_DISCOVERY_ID,
      label: 'Sunrise Spiral Shell',
      icon: '🐚',
      position: { x: 1030, y: 900 },
      collectionRadius: 95,
      itemId: SUNRISE_SPIRAL_SHELL_ITEM_ID,
    },
    {
      id: 'moon-speckle-shell',
      discoveryId: MOON_SPECKLE_SHELL_DISCOVERY_ID,
      label: 'Moon-speckle Shell',
      icon: '🌙',
      position: { x: 2080, y: 1710 },
      collectionRadius: 95,
      itemId: MOON_SPECKLE_SHELL_ITEM_ID,
    },
    {
      id: 'wave-fan-shell',
      discoveryId: WAVE_FAN_SHELL_DISCOVERY_ID,
      label: 'Wave-fan Shell',
      icon: '🌊',
      position: { x: 2970, y: 1640 },
      collectionRadius: 95,
      itemId: WAVE_FAN_SHELL_ITEM_ID,
    },
  ] satisfies readonly BeachDiscoverySpot[],
  colliders: [
    // Shell Cove rocks: collide with the visible rock feet, not empty sand above them.
    { id: 'collision:shell-cove-rock-west', x: 520, y: 610, width: 120, height: 70 },
    { id: 'collision:shell-cove-rock-middle', x: 650, y: 560, width: 120, height: 70 },
    { id: 'collision:shell-cove-rock-east', x: 1080, y: 590, width: 120, height: 70 },
    // Block only the central water of each visible tide pool so their banks and discoveries remain reachable.
    { id: 'collision:tide-pool-west', x: 1740, y: 1580, width: 110, height: 48 },
    { id: 'collision:tide-pool-middle', x: 2000, y: 1650, width: 105, height: 48 },
    { id: 'collision:tide-pool-east', x: 2210, y: 1510, width: 90, height: 42 },
    { id: 'collision:moonlit-rock-west', x: 3010, y: 1390, width: 120, height: 70 },
    { id: 'collision:moonlit-rock-middle', x: 3260, y: 1450, width: 140, height: 80 },
    { id: 'collision:moonlit-rock-east', x: 3360, y: 1600, width: 105, height: 65 },
    // Keep deep water impassable while leaving the pale shoreline shallows readable and usable.
    { id: 'collision:deep-water', x: 1800, y: 2160, width: 3420, height: 280 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type StarlightBeachMap = typeof STARLIGHT_BEACH_MAP;
