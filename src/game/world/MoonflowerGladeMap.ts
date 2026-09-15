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

export interface GladeGardenPlot {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
}

const DEFAULT_PLAYER_SPAWN = { x: 690, y: 900 } as const;
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };
const BRIDGE_Y = 900;
const BRIDGE_WALKABLE_HEIGHT = 142;
const NORTH_STREAM_HEIGHT = BRIDGE_Y - BRIDGE_WALKABLE_HEIGHT / 2;
const SOUTH_STREAM_START = BRIDGE_Y + BRIDGE_WALKABLE_HEIGHT / 2;
const SOUTH_STREAM_HEIGHT = 1800 - SOUTH_STREAM_START;
const WESTERN_GATE_Y = BRIDGE_Y;
const WESTERN_HEDGE_X = 128;
const WESTERN_HEDGE_WIDTH = 92;
const WESTERN_HEDGE_TOP = 110;
const WESTERN_HEDGE_BOTTOM = 1710;
const WESTERN_GATE_HALF_GAP = 95;
const NORTH_HEDGE_HEIGHT = WESTERN_GATE_Y - WESTERN_GATE_HALF_GAP - WESTERN_HEDGE_TOP;
const SOUTH_HEDGE_TOP = WESTERN_GATE_Y + WESTERN_GATE_HALF_GAP;
const SOUTH_HEDGE_HEIGHT = WESTERN_HEDGE_BOTTOM - SOUTH_HEDGE_TOP;

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
      approach: { x: 560, y: 705 },
    },
    {
      id: 'garden-plot',
      label: 'Garden Plot',
      position: { x: 890, y: 620 },
      approach: { x: 890, y: 790 },
    },
    {
      id: 'western-gate',
      label: 'Old Garden Gate',
      position: { x: 125, y: WESTERN_GATE_Y },
      approach: { x: 315, y: WESTERN_GATE_Y },
    },
    {
      id: 'little-bridge',
      label: 'Little Bridge',
      position: { x: 1400, y: 900 },
      approach: { x: 1400, y: 900 },
    },
    {
      id: 'hollow-tree',
      label: 'Hollow Tree',
      position: { x: 2200, y: 490 },
      approach: { x: 2050, y: 700 },
    },
    {
      id: 'moonflower-field',
      label: 'Moonflower Field',
      position: { x: 2080, y: 1230 },
      approach: { x: 1890, y: 1185 },
    },
  ] satisfies readonly GladeLandmark[],
  gardenPlots: [
    {
      id: 'garden:main',
      label: 'Cottage Garden',
      position: { x: 890, y: 620 },
      approach: { x: 890, y: 790 },
      width: 280,
      height: 190,
      orientation: 'horizontal',
    },
    {
      id: 'garden:upper',
      label: 'Upper Garden',
      position: { x: 910, y: 335 },
      approach: { x: 1080, y: 335 },
      width: 280,
      height: 190,
      orientation: 'horizontal',
    },
    {
      id: 'garden:stream-bank',
      label: 'Stream Garden',
      position: { x: 1160, y: 590 },
      approach: { x: 1045, y: 590 },
      width: 160,
      height: 420,
      orientation: 'vertical',
    },
  ] satisfies readonly GladeGardenPlot[],
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
    // The flowerbeds project below the cottage footprint. Give each bed its own compact
    // blocker while preserving the central route up the porch steps to the door.
    { id: 'collision:cottage-flowerbed-left', x: 435, y: 650, width: 154, height: 70 },
    { id: 'collision:cottage-flowerbed-right', x: 693, y: 650, width: 142, height: 70 },
    {
      id: 'collision:western-hedge-north',
      x: WESTERN_HEDGE_X,
      y: WESTERN_HEDGE_TOP + NORTH_HEDGE_HEIGHT / 2,
      width: WESTERN_HEDGE_WIDTH,
      height: NORTH_HEDGE_HEIGHT,
    },
    { id: 'collision:western-gate', x: 125, y: WESTERN_GATE_Y, width: 90, height: 196 },
    {
      id: 'collision:western-hedge-south',
      x: WESTERN_HEDGE_X,
      y: SOUTH_HEDGE_TOP + SOUTH_HEDGE_HEIGHT / 2,
      width: WESTERN_HEDGE_WIDTH,
      height: SOUTH_HEDGE_HEIGHT,
    },
    // H1.10 signs are physical props. Only the post/base blocks movement, not the full board.
    { id: 'collision:western-gate-sign', x: 300, y: 790, width: 28, height: 84 },
    { id: 'collision:sunbeam-direction-sign', x: 2560, y: 790, width: 28, height: 84 },
    // H1.4: visible woodland is now a real hard boundary. The right side deliberately
    // leaves a generous opening around the Sunbeam Village gateway at y=900.
    { id: 'collision:woodland-top', x: 1400, y: 145, width: 2520, height: 150 },
    { id: 'collision:woodland-bottom', x: 1400, y: 1655, width: 2520, height: 170 },
    { id: 'collision:woodland-right-north', x: 2640, y: 430, width: 190, height: 650 },
    { id: 'collision:woodland-right-south', x: 2640, y: 1370, width: 190, height: 650 },
    // The original top-row trees extend below the shared woodland band. These narrow
    // trunk/root blockers match the visible bases without turning their canopies solid.
    { id: 'collision:top-tree-430', x: 430, y: 225, width: 58, height: 120 },
    { id: 'collision:top-tree-820', x: 820, y: 245, width: 58, height: 120 },
    { id: 'collision:top-tree-1180', x: 1180, y: 225, width: 58, height: 120 },
    { id: 'collision:top-tree-1640', x: 1640, y: 225, width: 58, height: 120 },
    { id: 'collision:top-tree-1980', x: 1980, y: 225, width: 58, height: 120 },
    { id: 'collision:top-tree-2520', x: 2520, y: 245, width: 58, height: 120 },
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
    // The Hollow Tree trunk and rounded root flare extend substantially below the old
    // prototype blocker. Match that visible footprint so the player cannot stand under it.
    { id: 'collision:hollow-tree', x: 2200, y: 550, width: 190, height: 280 },
  ] satisfies readonly CollisionRectangle[],
} as const;

export type MoonflowerGladeMap = typeof MOONFLOWER_GLADE_MAP;
