import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';

export const RAINBOW_RUN_HUB_LOCATION_ID = 'location:rainbow-run-hub';

export const RAINBOW_RUN_HUB_LAYOUT = {
  bounds: {
    width: 2200,
    height: 1400,
    margin: 80,
  },
  meadowExit: {
    position: { x: 1100, y: 1320 },
    approach: { x: 1100, y: 1180 },
  },
  playerSpawn: { x: 1100, y: 1140 },
  nova: { x: 650, y: 760 },
  tent: { x: 510, y: 430 },
  ribbonBoard: {
    position: { x: 970, y: 440 },
    approach: { x: 970, y: 610 },
  },
  cupBoard: {
    position: { x: 1380, y: 440 },
    approach: { x: 1380, y: 610 },
  },
  coursePoster: {
    position: { x: 1710, y: 520 },
    approach: { x: 1650, y: 690 },
  },
  raceGate: {
    position: { x: 1870, y: 860 },
    approach: { x: 1660, y: 860 },
  },
  flags: [
    { x: 300, y: 620 },
    { x: 390, y: 980 },
    { x: 1530, y: 300 },
    { x: 1770, y: 330 },
    { x: 1930, y: 620 },
  ],
  pathPoints: [
    { x: 1100, y: 1320 },
    { x: 1100, y: 1080 },
    { x: 1210, y: 900 },
    { x: 1450, y: 830 },
    { x: 1660, y: 860 },
    { x: 2050, y: 860 },
  ] satisfies readonly MapPoint[],
} as const;

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
  playerSpawn: RAINBOW_RUN_HUB_LAYOUT.playerSpawn,
  colliders,
};
