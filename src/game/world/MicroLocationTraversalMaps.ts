import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { TraversalMapDefinition } from './MapTraversal';

export const CRYSTAL_GROTTO_MAP = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 70,
  playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 155 },
  colliders: [
    { id: 'grotto-upper-edge', x: GAME_WIDTH / 2, y: 92, width: GAME_WIDTH, height: 46 },
    { id: 'grotto-low-crystal', x: 315, y: 365, width: 96, height: 220 },
    { id: 'grotto-bright-crystal', x: 650, y: 245, width: 76, height: 175 },
    { id: 'grotto-bell-crystal', x: 955, y: 390, width: 70, height: 135 },
    { id: 'grotto-pool', x: 640, y: 470, width: 610, height: 120 },
  ],
} satisfies TraversalMapDefinition;

export const FIREFLY_GROVE_MAP = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  margin: 65,
  playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 150 },
  colliders: [
    { id: 'grove-upper-edge', x: GAME_WIDTH / 2, y: 92, width: GAME_WIDTH, height: 46 },
    { id: 'grove-friendly-tree', x: 335, y: 340, width: 105, height: 300 },
    { id: 'grove-lantern-plant', x: 825, y: 340, width: 170, height: 96 },
    { id: 'grove-pool', x: 620, y: 470, width: 570, height: 130 },
  ],
} satisfies TraversalMapDefinition;
