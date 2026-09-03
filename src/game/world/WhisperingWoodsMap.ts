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
    // Tree collision follows the trunk/root footprint rather than the full canopy. This lets
    // the unicorn walk behind foliage while still preventing movement through visible trunks.
    { id: 'collision:tree-520-510', x: 520, y: 465, width: 96, height: 90 },
    { id: 'collision:tree-820-420', x: 820, y: 382, width: 88, height: 82 },
    { id: 'collision:tree-1390-430', x: 1390, y: 386, width: 100, height: 90 },
    { id: 'collision:tree-1660-1490', x: 1660, y: 1447, width: 96, height: 88 },
    { id: 'collision:tree-2140-1810', x: 2140, y: 1770, width: 92, height: 84 },
    { id: 'collision:tree-2690-540', x: 2690, y: 495, width: 102, height: 92 },
    { id: 'collision:tree-3070-1190', x: 3070, y: 1149, width: 92, height: 84 },
    { id: 'collision:tree-720-1760', x: 720, y: 1718, width: 94, height: 86 },
    // R6 production-pass boundary trees are visible physical objects too, so their trunk
    // footprints now participate in collision instead of acting as walk-through scenery.
    { id: 'collision:production-tree-390-430', x: 390, y: 386, width: 96, height: 90 },
    { id: 'collision:production-tree-930-350', x: 930, y: 311, width: 88, height: 82 },
    { id: 'collision:production-tree-1770-380', x: 1770, y: 333, width: 104, height: 94 },
    { id: 'collision:production-tree-2300-390', x: 2300, y: 350, width: 92, height: 84 },
    { id: 'collision:production-tree-3020-420', x: 3020, y: 374, width: 102, height: 92 },
    { id: 'collision:production-tree-520-1830', x: 520, y: 1786, width: 96, height: 90 },
    { id: 'collision:production-tree-1290-1810', x: 1290, y: 1771, width: 88, height: 82 },
    { id: 'collision:production-tree-2780-1830', x: 2780, y: 1787, width: 96, height: 88 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type WhisperingWoodsMap = typeof WHISPERING_WOODS_MAP;
