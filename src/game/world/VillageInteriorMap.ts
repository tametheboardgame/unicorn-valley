import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';

export type VillageInteriorId = 'bakery' | 'accessory-shop' | 'library';

export type VillageInteriorAnchorId =
  | 'entry'
  | 'exit'
  | 'counter'
  | 'npc-work'
  | 'primary-feature'
  | 'secondary-feature';

export interface VillageInteriorAnchor {
  id: VillageInteriorAnchorId;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export interface VillageInteriorRoomShell {
  left: number;
  right: number;
  top: number;
  bottom: number;
  backWallBottom: number;
  doorWidth: number;
}

export interface VillageInteriorDefinition extends TraversalMapDefinition {
  id: VillageInteriorId;
  title: string;
  roomShell: VillageInteriorRoomShell;
  anchors: Readonly<Record<VillageInteriorAnchorId, VillageInteriorAnchor>>;
  colliders: readonly CollisionRectangle[];
}

export const VILLAGE_INTERIOR_SCENE_DATA_KEY = 'village-interior-id';

const ROOM_SHELL = {
  left: 80,
  right: 1420,
  top: 70,
  bottom: 1000,
  backWallBottom: 360,
  doorWidth: 190,
} as const satisfies VillageInteriorRoomShell;

const MAP_WIDTH = 1500;
const MAP_HEIGHT = 1080;
const MAP_MARGIN = 64;
const PLAYER_SPAWN = { x: 750, y: 870 } as const;
const EXIT_POSITION = { x: 750, y: 970 } as const;
const EXIT_APPROACH = { x: 750, y: 900 } as const;
const ENTRY_POSITION = { ...PLAYER_SPAWN } as const;

const exitGapWidth = ROOM_SHELL.doorWidth + 54;
const bottomSegmentWidth = (ROOM_SHELL.right - ROOM_SHELL.left - exitGapWidth) / 2;
const bottomLeftCentre = ROOM_SHELL.left + bottomSegmentWidth / 2;
const bottomRightCentre = ROOM_SHELL.right - bottomSegmentWidth / 2;
const bottomWallY = ROOM_SHELL.bottom + 8;

const ROOM_COLLIDERS = [
  {
    id: 'wall-top',
    x: 750,
    y: (ROOM_SHELL.top + ROOM_SHELL.backWallBottom) / 2,
    width: ROOM_SHELL.right - ROOM_SHELL.left,
    height: ROOM_SHELL.backWallBottom - ROOM_SHELL.top,
  },
  {
    id: 'wall-left',
    x: ROOM_SHELL.left,
    y: (ROOM_SHELL.top + ROOM_SHELL.bottom) / 2,
    width: 64,
    height: ROOM_SHELL.bottom - ROOM_SHELL.top,
  },
  {
    id: 'wall-right',
    x: ROOM_SHELL.right,
    y: (ROOM_SHELL.top + ROOM_SHELL.bottom) / 2,
    width: 64,
    height: ROOM_SHELL.bottom - ROOM_SHELL.top,
  },
  {
    id: 'wall-bottom-left',
    x: bottomLeftCentre,
    y: bottomWallY,
    width: bottomSegmentWidth,
    height: 64,
  },
  {
    id: 'wall-bottom-right',
    x: bottomRightCentre,
    y: bottomWallY,
    width: bottomSegmentWidth,
    height: 64,
  },
] as const satisfies readonly CollisionRectangle[];

function anchor(
  id: VillageInteriorAnchorId,
  label: string,
  position: MapPoint,
  approach: MapPoint,
): VillageInteriorAnchor {
  return { id, label, position, approach };
}

function sharedAnchors(
  counter: VillageInteriorAnchor,
  npcWork: VillageInteriorAnchor,
  primaryFeature: VillageInteriorAnchor,
  secondaryFeature: VillageInteriorAnchor,
): Readonly<Record<VillageInteriorAnchorId, VillageInteriorAnchor>> {
  return {
    entry: anchor('entry', 'Entrance', ENTRY_POSITION, ENTRY_POSITION),
    exit: anchor('exit', 'Sunbeam Village', EXIT_POSITION, EXIT_APPROACH),
    counter,
    'npc-work': npcWork,
    'primary-feature': primaryFeature,
    'secondary-feature': secondaryFeature,
  };
}

const BAKERY: VillageInteriorDefinition = {
  id: 'bakery',
  title: 'Sunbeam Bakery',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  margin: MAP_MARGIN,
  playerSpawn: PLAYER_SPAWN,
  roomShell: ROOM_SHELL,
  anchors: sharedAnchors(
    anchor('counter', 'Bakery counter', { x: 815, y: 510 }, { x: 815, y: 625 }),
    anchor('npc-work', 'Bakery work position', { x: 1010, y: 410 }, { x: 1010, y: 580 }),
    anchor('primary-feature', 'Recipe shelf', { x: 1280, y: 455 }, { x: 1280, y: 600 }),
    anchor('secondary-feature', 'Wobbly Cake showcase', { x: 350, y: 690 }, { x: 350, y: 820 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    { id: 'counter', x: 815, y: 525, width: 440, height: 82 },
    { id: 'oven', x: 230, y: 455, width: 130, height: 116 },
    { id: 'prep-bench', x: 418, y: 461, width: 175, height: 78 },
    { id: 'recipe-shelf', x: 1280, y: 455, width: 136, height: 110 },
    { id: 'cake-table', x: 350, y: 725, width: 230, height: 110 },
    { id: 'cafe-table', x: 1165, y: 755, width: 160, height: 105 },
  ],
};

const ACCESSORY_SHOP: VillageInteriorDefinition = {
  id: 'accessory-shop',
  title: 'Twinkle & Thread',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  margin: MAP_MARGIN,
  playerSpawn: PLAYER_SPAWN,
  roomShell: ROOM_SHELL,
  anchors: sharedAnchors(
    anchor('counter', 'Twinkle & Thread counter', { x: 760, y: 520 }, { x: 760, y: 650 }),
    anchor('npc-work', 'Shop work position', { x: 1060, y: 520 }, { x: 1060, y: 665 }),
    anchor('primary-feature', 'Accessory display', { x: 430, y: 600 }, { x: 430, y: 720 }),
    anchor('secondary-feature', 'Mirror display', { x: 1110, y: 650 }, { x: 1110, y: 760 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    { id: 'counter', x: 760, y: 535, width: 520, height: 88 },
    { id: 'display-left', x: 430, y: 600, width: 150, height: 86 },
    { id: 'display-right', x: 1110, y: 650, width: 150, height: 86 },
  ],
};

const LIBRARY: VillageInteriorDefinition = {
  id: 'library',
  title: 'Story House',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  margin: MAP_MARGIN,
  playerSpawn: PLAYER_SPAWN,
  roomShell: ROOM_SHELL,
  anchors: sharedAnchors(
    anchor('counter', 'Story desk', { x: 760, y: 690 }, { x: 760, y: 805 }),
    anchor('npc-work', 'Story keeper position', { x: 1110, y: 560 }, { x: 1110, y: 710 }),
    anchor('primary-feature', 'Story table', { x: 760, y: 690 }, { x: 760, y: 820 }),
    anchor('secondary-feature', 'Valley clue shelf', { x: 410, y: 500 }, { x: 410, y: 650 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    { id: 'shelf-left', x: 400, y: 430, width: 190, height: 70 },
    { id: 'shelf-centre', x: 750, y: 430, width: 190, height: 70 },
    { id: 'shelf-right', x: 1100, y: 430, width: 190, height: 70 },
    { id: 'story-table', x: 760, y: 700, width: 360, height: 125 },
  ],
};

export const VILLAGE_INTERIOR_MAPS = {
  bakery: BAKERY,
  'accessory-shop': ACCESSORY_SHOP,
  library: LIBRARY,
} as const satisfies Readonly<Record<VillageInteriorId, VillageInteriorDefinition>>;

export function isVillageInteriorId(value: unknown): value is VillageInteriorId {
  return value === 'bakery' || value === 'accessory-shop' || value === 'library';
}

export function getVillageInteriorMap(interiorId: VillageInteriorId): VillageInteriorDefinition {
  return VILLAGE_INTERIOR_MAPS[interiorId];
}

export function getVillageInteriorAnchor(
  interiorId: VillageInteriorId,
  anchorId: VillageInteriorAnchorId,
): VillageInteriorAnchor {
  return VILLAGE_INTERIOR_MAPS[interiorId].anchors[anchorId];
}
