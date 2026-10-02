import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';

export const RAINBOW_RUN_HUB_LOCATION_ID = 'location:rainbow-run-hub';

// H4.4A owns the first-pass physical hub; the post-H4 maturity package refines this footprint.
export const RAINBOW_RUN_HUB_LAYOUT = {
  bounds: {
    width: 2200,
    height: 1400,
    margin: 80,
  },
  meadowExit: {
    position: { x: 1100, y: 1320 },
    approach: { x: 1100, y: 1180 },
    walkThroughPosition: { x: 1100, y: 1240 },
  },
  playerSpawn: { x: 1100, y: 980 },
  nova: { x: 430, y: 800 },
  tent: { x: 470, y: 360 },
  ribbonBoard: {
    position: { x: 760, y: 390 },
    approach: { x: 760, y: 570 },
  },
  cupBoard: {
    position: { x: 1150, y: 390 },
    approach: { x: 1150, y: 570 },
  },
  coursePoster: {
    position: { x: 1600, y: 390 },
    approach: { x: 1600, y: 570 },
  },
  raceGate: {
    position: { x: 1900, y: 900 },
    approach: { x: 1690, y: 900 },
  },
  expandedRaceEntries: {
    petalParade: { x: 1340, y: 900 },
    rainbowCup: { x: 1150, y: 570 },
  },
  flags: [
    { x: 250, y: 580 },
    { x: 300, y: 1040 },
    { x: 1380, y: 250 },
    { x: 1780, y: 280 },
    { x: 2010, y: 650 },
  ],
  pathPoints: [
    { x: 1100, y: 1320 },
    { x: 1100, y: 1080 },
    { x: 1210, y: 920 },
    { x: 1450, y: 870 },
    { x: 1690, y: 900 },
    { x: 2090, y: 900 },
  ] satisfies readonly MapPoint[],
} as const;

const DEFAULT_PLAYER_SPAWN: MapPoint = { ...RAINBOW_RUN_HUB_LAYOUT.playerSpawn };
const playerSpawn: MapPoint = { ...DEFAULT_PLAYER_SPAWN };

export function setRainbowRunHubPlayerSpawn(point: MapPoint): void {
  playerSpawn.x = point.x;
  playerSpawn.y = point.y;
}

export function resetRainbowRunHubPlayerSpawn(): void {
  playerSpawn.x = DEFAULT_PLAYER_SPAWN.x;
  playerSpawn.y = DEFAULT_PLAYER_SPAWN.y;
}

const colliders: CollisionRectangle[] = [
  {
    id: 'collision:race-hub-tent',
    x: RAINBOW_RUN_HUB_LAYOUT.tent.x,
    y: RAINBOW_RUN_HUB_LAYOUT.tent.y,
    width: 430,
    height: 260,
  },
  {
    id: 'collision:race-hub-ribbon-board',
    x: RAINBOW_RUN_HUB_LAYOUT.ribbonBoard.position.x,
    y: RAINBOW_RUN_HUB_LAYOUT.ribbonBoard.position.y,
    width: 310,
    height: 120,
  },
  {
    id: 'collision:race-hub-cup-board',
    x: RAINBOW_RUN_HUB_LAYOUT.cupBoard.position.x,
    y: RAINBOW_RUN_HUB_LAYOUT.cupBoard.position.y,
    width: 330,
    height: 130,
  },
  {
    id: 'collision:race-hub-race-post-north',
    x: RAINBOW_RUN_HUB_LAYOUT.raceGate.position.x,
    y: RAINBOW_RUN_HUB_LAYOUT.raceGate.position.y - 150,
    width: 70,
    height: 190,
  },
  {
    id: 'collision:race-hub-race-post-south',
    x: RAINBOW_RUN_HUB_LAYOUT.raceGate.position.x,
    y: RAINBOW_RUN_HUB_LAYOUT.raceGate.position.y + 150,
    width: 70,
    height: 190,
  },
];

export const RAINBOW_RUN_HUB_MAP: TraversalMapDefinition = {
  width: RAINBOW_RUN_HUB_LAYOUT.bounds.width,
  height: RAINBOW_RUN_HUB_LAYOUT.bounds.height,
  margin: RAINBOW_RUN_HUB_LAYOUT.bounds.margin,
  playerSpawn,
  colliders,
};
