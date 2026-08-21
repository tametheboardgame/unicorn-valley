import type { DiscoveryId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';

export const WHISPERING_WOODS_LOCATION_ID = 'location:whispering-woods';

export interface WoodsEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west';
}

export interface WoodsLandmark {
  id: string;
  label: string;
  position: MapPoint;
}

export interface WoodsDiscoverySpot {
  id: string;
  discoveryId: DiscoveryId;
  label: string;
  position: MapPoint;
  collectionRadius: number;
}

const DEFAULT_PLAYER_SPAWN = { x: 360, y: 1090 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setWhisperingWoodsPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetWhisperingWoodsPlayerSpawn(): void {
  setWhisperingWoodsPlayerSpawn(DEFAULT_PLAYER_SPAWN);
}

export const WHISPERING_WOODS_MAP = {
  width: 3300,
  height: 2200,
  margin: 90,
  playerSpawn,
  entrances: [
    {
      id: 'crystal-brook',
      label: 'Crystal Brook',
      position: { x: 120, y: 1090 },
      approach: { x: 350, y: 1090 },
      direction: 'west',
    },
  ] satisfies readonly WoodsEntrance[],
  landmarks: [
    { id: 'mooncap-grove', label: 'Mooncap Grove', position: { x: 1180, y: 620 } },
    { id: 'glowfern-arch', label: 'Glowfern Arch', position: { x: 1980, y: 1080 } },
    { id: 'lantern-clearing', label: 'Lantern Clearing', position: { x: 2740, y: 760 } },
    { id: 'mossy-whisper-path', label: 'Mossy Whisper Path', position: { x: 2810, y: 1590 } },
  ] satisfies readonly WoodsLandmark[],
  discoverySpots: [
    {
      id: 'mooncap-grove',
      discoveryId: 'discovery:woods-mooncap-grove',
      label: 'Mooncap Grove',
      position: { x: 1180, y: 620 },
      collectionRadius: 105,
    },
    {
      id: 'glowfern-arch',
      discoveryId: 'discovery:woods-glowfern-arch',
      label: 'Glowfern Arch',
      position: { x: 1980, y: 1080 },
      collectionRadius: 110,
    },
  ] satisfies readonly WoodsDiscoverySpot[],
  colliders: [
    { id: 'collision:north-root-cluster', x: 690, y: 420, width: 420, height: 250 },
    { id: 'collision:mooncap-tree', x: 1370, y: 430, width: 260, height: 260 },
    { id: 'collision:middle-root-cluster', x: 1660, y: 1430, width: 420, height: 260 },
    { id: 'collision:lantern-oak', x: 2690, y: 520, width: 330, height: 280 },
    { id: 'collision:south-grove', x: 2250, y: 1840, width: 520, height: 250 },
    { id: 'collision:east-root-wall', x: 3060, y: 1160, width: 230, height: 520 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type WhisperingWoodsMap = typeof WHISPERING_WOODS_MAP;
