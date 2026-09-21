import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { SUNBEAM_VILLAGE_LAYOUT } from './SunbeamVillageLayout';
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

type SpawnPoint = MapPoint | (() => MapPoint);

export function setSunbeamVillagePlayerSpawn(point: SpawnPoint): void {
  const resolved = typeof point === 'function' ? point() : point;
  playerSpawn.x = resolved.x;
  playerSpawn.y = resolved.y;
  if (resolved.x === 330 && resolved.y === 950) {
    setWorldArrivalFacing('SunbeamVillageScene', 'right');
  } else if (resolved.x === 2640 && resolved.y === 950) {
    setWorldArrivalFacing('SunbeamVillageScene', 'left');
  }
}

export function resetSunbeamVillagePlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const SUNBEAM_VILLAGE_MAP = {
  width: SUNBEAM_VILLAGE_LAYOUT.map.width,
  height: SUNBEAM_VILLAGE_LAYOUT.map.height,
  margin: SUNBEAM_VILLAGE_LAYOUT.map.margin,
  playerSpawn,
  landmarks: [
    {
      id: 'bakery',
      label: 'Sunbeam Bakery',
      icon: '🥐',
      position: {
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.x,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.y,
      },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach },
    },
    {
      id: 'accessory-shop',
      label: 'Twinkle & Thread',
      icon: '🎀',
      position: {
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.x,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.y,
      },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.approach },
    },
    {
      id: 'library',
      label: 'Story House',
      icon: '📚',
      position: {
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.library.x,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.library.y,
      },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach },
    },
    {
      id: 'sunbeam-fountain',
      label: 'Sunbeam Fountain',
      icon: '✨',
      position: { x: SUNBEAM_VILLAGE_LAYOUT.fountain.x, y: SUNBEAM_VILLAGE_LAYOUT.fountain.y },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.fountain.approach },
    },
  ] satisfies readonly VillageLandmark[],
  entrances: [
    {
      id: 'moonflower-glade',
      label: 'Moonflower Glade',
      position: { ...SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.approach },
      direction: 'west',
    },
    {
      id: 'rainbow-meadow',
      label: 'Rainbow Meadow',
      position: { ...SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position },
      approach: { ...SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.approach },
      direction: 'east',
    },
  ] satisfies readonly VillageEntrance[],
  npcMarkers: [
    { id: 'willow', label: 'Willow', position: { ...SUNBEAM_VILLAGE_LAYOUT.npcPositions.willow } },
    {
      id: 'marigold',
      label: 'Marigold',
      position: { ...SUNBEAM_VILLAGE_LAYOUT.npcPositions.marigold },
    },
    { id: 'pebble', label: 'Pebble', position: { ...SUNBEAM_VILLAGE_LAYOUT.npcPositions.pebble } },
  ] satisfies readonly VillageNpcMarker[],
  colliders: [
    {
      id: 'collision:bakery',
      x: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.x,
      y: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.y,
      width: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.width,
      height: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.height,
    },
    {
      id: 'collision:accessory-shop',
      x: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.x,
      y: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.y,
      width: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.width,
      height: SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.height,
    },
    {
      id: 'collision:library',
      x: SUNBEAM_VILLAGE_LAYOUT.buildings.library.x,
      y: SUNBEAM_VILLAGE_LAYOUT.buildings.library.y,
      width: SUNBEAM_VILLAGE_LAYOUT.buildings.library.width,
      height: SUNBEAM_VILLAGE_LAYOUT.buildings.library.height,
    },
    {
      id: 'collision:fountain',
      x: SUNBEAM_VILLAGE_LAYOUT.fountain.x,
      y: SUNBEAM_VILLAGE_LAYOUT.fountain.y,
      width: SUNBEAM_VILLAGE_LAYOUT.fountain.collisionWidth,
      height: SUNBEAM_VILLAGE_LAYOUT.fountain.collisionHeight,
    },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type SunbeamVillageMap = typeof SUNBEAM_VILLAGE_MAP;
