import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { setWorldArrivalFacing } from './WorldArrivalState';

export const SUNBEAM_VILLAGE_LOCATION_ID = 'location:sunbeam-village';

export interface VillageLandmark {
  id: string;
  label: string;
  icon: string;
  position: MapPoint;
  approach: MapPoint;
}

export interface VillageEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'west' | 'east';
}

export interface VillageNpcMarker {
  id: string;
  label: string;
  position: MapPoint;
}

const DEFAULT_PLAYER_SPAWN = { x: 300, y: 950 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setSunbeamVillagePlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
  if (point.x === 330 && point.y === 950) {
    setWorldArrivalFacing('SunbeamVillageScene', 'right');
  } else if (point.x === 2640 && point.y === 950) {
    setWorldArrivalFacing('SunbeamVillageScene', 'left');
  }
}

export function resetSunbeamVillagePlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const SUNBEAM_VILLAGE_MAP = {
  width: 3000,
  height: 1900,
  margin: 90,
  playerSpawn,
  square: {
    x: 1500,
    y: 1050,
    width: 1220,
    height: 690,
  },
  landmarks: [
    {
      id: 'bakery',
      label: 'Sunbeam Bakery',
      icon: '🥐',
      position: { x: 900, y: 470 },
      approach: { x: 900, y: 710 },
    },
    {
      id: 'accessory-shop',
      label: 'Twinkle & Thread',
      icon: '🎀',
      position: { x: 1500, y: 430 },
      approach: { x: 1500, y: 690 },
    },
    {
      id: 'library',
      label: 'Story House',
      icon: '📚',
      position: { x: 2110, y: 480 },
      approach: { x: 2110, y: 720 },
    },
    {
      id: 'sunbeam-fountain',
      label: 'Sunbeam Fountain',
      icon: '✨',
      position: { x: 1500, y: 1050 },
      approach: { x: 1310, y: 1050 },
    },
  ] satisfies readonly VillageLandmark[],
  entrances: [
    {
      id: 'moonflower-glade',
      label: 'Moonflower Glade',
      position: { x: 120, y: 950 },
      approach: { x: 330, y: 950 },
      direction: 'west',
    },
    {
      id: 'rainbow-meadow',
      label: 'Rainbow Meadow',
      position: { x: 2880, y: 950 },
      approach: { x: 2640, y: 950 },
      direction: 'east',
    },
  ] satisfies readonly VillageEntrance[],
  npcMarkers: [
    { id: 'willow', label: 'Willow', position: { x: 1040, y: 1160 } },
    { id: 'marigold', label: 'Marigold', position: { x: 700, y: 860 } },
    { id: 'pebble', label: 'Pebble', position: { x: 1900, y: 1210 } },
    { id: 'shopkeeper-marker', label: 'Shopkeeper', position: { x: 1730, y: 770 } },
  ] satisfies readonly VillageNpcMarker[],
  colliders: [
    { id: 'collision:bakery', x: 900, y: 470, width: 450, height: 320 },
    { id: 'collision:accessory-shop', x: 1500, y: 430, width: 430, height: 320 },
    { id: 'collision:library', x: 2110, y: 480, width: 490, height: 330 },
    { id: 'collision:fountain', x: 1500, y: 1050, width: 220, height: 220 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type SunbeamVillageMap = typeof SUNBEAM_VILLAGE_MAP;
