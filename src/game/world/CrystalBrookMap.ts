import type { DiscoveryId, ItemId } from '../../content/contentTypes';
import type { CollisionRectangle, MapPoint } from './MapTraversal';

export const CRYSTAL_BROOK_LOCATION_ID = 'location:crystal-brook';

export interface CrystalBrookEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west' | 'east';
}

export interface CrystalBrookCollectableSpot {
  id: string;
  itemId: ItemId;
  discoveryId: DiscoveryId;
  flagId: string;
  label: string;
  position: MapPoint;
  collectionRadius: number;
}

export interface CrystalBrookNpcVisitPoint {
  id: string;
  label: string;
  position: MapPoint;
}

export interface CrystalBrookSecretRoute {
  id: string;
  label: string;
  discoveryId: DiscoveryId;
  position: MapPoint;
  discoveryRadius: number;
  trail: readonly MapPoint[];
}

const DEFAULT_PLAYER_SPAWN = { x: 360, y: 1090 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setCrystalBrookPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetCrystalBrookPlayerSpawn(): void {
  setCrystalBrookPlayerSpawn(DEFAULT_PLAYER_SPAWN);
}

export const CRYSTAL_BROOK_MAP = {
  width: 3500,
  height: 2200,
  margin: 90,
  playerSpawn,
  entrances: [
    {
      id: 'rainbow-meadow',
      label: 'Rainbow Meadow',
      position: { x: 120, y: 1090 },
      approach: { x: 340, y: 1090 },
      direction: 'west',
    },
  ] satisfies readonly CrystalBrookEntrance[],
  shallowStream: {
    width: 150,
    points: [
      { x: 1060, y: 960 },
      { x: 1290, y: 1050 },
      { x: 1580, y: 1120 },
      { x: 1940, y: 1110 },
      { x: 2250, y: 1230 },
      { x: 2460, y: 1300 },
    ] satisfies readonly MapPoint[],
  },
  steppingStones: [
    { x: 1010, y: 1010 },
    { x: 1125, y: 970 },
    { x: 1240, y: 1015 },
    { x: 2200, y: 1180 },
    { x: 2315, y: 1225 },
    { x: 2430, y: 1180 },
  ] satisfies readonly MapPoint[],
  collectableSpots: [
    {
      id: 'crystal-north-bank',
      itemId: 'item:brook-river-crystal',
      discoveryId: 'discovery:brook-river-crystal',
      flagId: 'flag:r5-brook-crystal-north-bank',
      label: 'River Crystal',
      position: { x: 920, y: 590 },
      collectionRadius: 76,
    },
    {
      id: 'crystal-stepping-bend',
      itemId: 'item:brook-river-crystal',
      discoveryId: 'discovery:brook-river-crystal',
      flagId: 'flag:r5-brook-crystal-stepping-bend',
      label: 'River Crystal',
      position: { x: 1510, y: 1260 },
      collectionRadius: 76,
    },
    {
      id: 'shell-reed-bank',
      itemId: 'item:brook-singing-shell',
      discoveryId: 'discovery:brook-singing-shell',
      flagId: 'flag:r5-brook-shell-reed-bank',
      label: 'Singing Shell',
      position: { x: 1980, y: 630 },
      collectionRadius: 76,
    },
    {
      id: 'shell-lower-pool',
      itemId: 'item:brook-singing-shell',
      discoveryId: 'discovery:brook-singing-shell',
      flagId: 'flag:r5-brook-shell-lower-pool',
      label: 'Singing Shell',
      position: { x: 2790, y: 1510 },
      collectionRadius: 76,
    },
  ] satisfies readonly CrystalBrookCollectableSpot[],
  npcVisitPoints: [
    { id: 'brook-overlook', label: 'Brook Overlook', position: { x: 1720, y: 830 } },
    { id: 'grotto-clearing', label: 'Grotto Clearing', position: { x: 2980, y: 1780 } },
  ] satisfies readonly CrystalBrookNpcVisitPoint[],
  secretRoutes: [
    {
      id: 'prism-grotto-route',
      label: 'Prism Grotto',
      discoveryId: 'discovery:prism-grotto',
      position: { x: 3130, y: 1850 },
      discoveryRadius: 105,
      trail: [
        { x: 2480, y: 1540 },
        { x: 2630, y: 1630 },
        { x: 2770, y: 1720 },
        { x: 2940, y: 1800 },
        { x: 3130, y: 1850 },
      ],
    },
  ] satisfies readonly CrystalBrookSecretRoute[],
  colliders: [
    // Water collision stays inset from the visible pool edge so the bank reads naturally.
    { id: 'collision:brook-upper-pool', x: 1370, y: 540, width: 430, height: 180 },
    { id: 'collision:brook-lower-pool', x: 2780, y: 1320, width: 390, height: 160 },
    // R6 cliff art is physical scenery, with collision matching the visible rock masses.
    { id: 'collision:cliff-west', x: 520, y: 410, width: 320, height: 150 },
    { id: 'collision:cliff-north-west', x: 880, y: 350, width: 260, height: 135 },
    { id: 'collision:cliff-north-east', x: 2350, y: 310, width: 300, height: 150 },
    { id: 'collision:cliff-east', x: 3190, y: 520, width: 300, height: 170 },
    // Vegetation blocks at their visible bases instead of broad empty rectangles around them.
    { id: 'collision:north-crystal-bank', x: 2470, y: 505, width: 230, height: 125 },
    { id: 'collision:south-reed-bank', x: 1890, y: 1770, width: 230, height: 115 },
    // The waterfall itself is not a walk-through object.
    { id: 'collision:crystal-cascade', x: 3150, y: 665, width: 130, height: 235 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type CrystalBrookMap = typeof CRYSTAL_BROOK_MAP;
