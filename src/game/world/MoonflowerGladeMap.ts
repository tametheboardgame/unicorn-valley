import type { CollisionRectangle, MapPoint } from './MapTraversal';
import { setWorldArrivalFacing } from './WorldArrivalState';

export interface GladeLandmark {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export interface GladeEntrance {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  direction: 'east' | 'south';
}

const DEFAULT_PLAYER_SPAWN = { x: 690, y: 900 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };
const BRIDGE_Y = 900;
const BRIDGE_WALKABLE_HEIGHT = 142;
const NORTH_STREAM_HEIGHT = BRIDGE_Y - BRIDGE_WALKABLE_HEIGHT / 2;
const SOUTH_STREAM_START = BRIDGE_Y + BRIDGE_WALKABLE_HEIGHT / 2;
const SOUTH_STREAM_HEIGHT = 1800 - SOUTH_STREAM_START;

export function setMoonflowerGladePlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
  if (point.x === 2470 && point.y === 900) {
    setWorldArrivalFacing('MoonflowerGladeScene', 'left');
  }
}

export function resetMoonflowerGladePlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const MOONFLOWER_GLADE_MAP = {
  width: 2800,
  height: 1800,
  margin: 90,
  playerSpawn,
  bridge: {
    x: 1400,
    y: BRIDGE_Y,
    width: 380,
    height: 190,
    walkableHeight: BRIDGE_WALKABLE_HEIGHT,
  },
  landmarks: [
    {
      id: 'moonflower-cottage',
      label: 'Moonflower Cottage',
      position: { x: 560, y: 470 },
      approach: { x: 560, y: 720 },
    },
    {
      id: 'garden-plot',
      label: 'Garden Plot',
      position: { x: 890, y: 620 },
      approach: { x: 890, y: 790 },
    },
    {
      id: 'little-bridge',
      label: 'Little Bridge',
      position: { x: 1400, y: 900 },
      approach: { x: 1400, y: 900 },
    },
    {
      id: 'display-stump',
      label: 'Discovery Display',
      position: { x: 850, y: 1120 },
      approach: { x: 940, y: 1120 },
    },
    {
      id: 'hollow-tree',
      label: 'Hollow Tree',
      position: { x: 2200, y: 490 },
      approach: { x: 2140, y: 710 },
    },
    {
      id: 'moonflower-field',
      label: 'Moonflower Field',
      position: { x: 2080, y: 1230 },
      approach: { x: 1900, y: 1230 },
    },
  ] satisfies readonly GladeLandmark[],
  entrances: [
    {
      id: 'sunbeam-village',
      label: 'Sunbeam Village → Rainbow Meadow',
      position: { x: 2680, y: 900 },
      approach: { x: 2470, y: 900 },
      direction: 'east',
    },
  ] satisfies readonly GladeEntrance[],
  colliders: [
    { id: 'collision:cottage', x: 560, y: 470, width: 460, height: 360 },
    {
      id: 'collision:stream-north',
      x: 1400,
      y: NORTH_STREAM_HEIGHT / 2,
      width: 220,
      height: NORTH_STREAM_HEIGHT,
    },
    {
      id: 'collision:stream-south',
      x: 1400,
      y: SOUTH_STREAM_START + SOUTH_STREAM_HEIGHT / 2,
      width: 220,
      height: SOUTH_STREAM_HEIGHT,
    },
    { id: 'collision:hollow-tree', x: 2200, y: 520, width: 170, height: 220 },
    { id: 'collision:display-stump', x: 850, y: 1120, width: 84, height: 72 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type MoonflowerGladeMap = typeof MOONFLOWER_GLADE_MAP;
