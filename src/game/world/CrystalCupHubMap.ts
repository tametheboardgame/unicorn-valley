import type { MapPoint, TraversalMapDefinition } from './MapTraversal';

export const CRYSTAL_CUP_HUB_LOCATION_ID = 'location:crystal-cup-hub';

export const CRYSTAL_CUP_HUB_LAYOUT = {
  bounds: { width: 1800, height: 1100, margin: 80 },
  brookExit: {
    position: { x: 900, y: 1030 },
    approach: { x: 900, y: 900 },
  },
  playerSpawn: { x: 900, y: 840 },
  raceGate: {
    position: { x: 900, y: 120 },
    approach: { x: 900, y: 310 },
  },
  pathPoints: [
    { x: 900, y: 1030 },
    { x: 900, y: 840 },
    { x: 900, y: 620 },
    { x: 900, y: 420 },
    { x: 900, y: 120 },
  ] satisfies readonly MapPoint[],
} as const;

const DEFAULT_PLAYER_SPAWN: MapPoint = { ...CRYSTAL_CUP_HUB_LAYOUT.playerSpawn };
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setCrystalCupHubPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetCrystalCupHubPlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

export const CRYSTAL_CUP_HUB_MAP: TraversalMapDefinition = {
  width: CRYSTAL_CUP_HUB_LAYOUT.bounds.width,
  height: CRYSTAL_CUP_HUB_LAYOUT.bounds.height,
  margin: CRYSTAL_CUP_HUB_LAYOUT.bounds.margin,
  playerSpawn,
  colliders: [],
};
