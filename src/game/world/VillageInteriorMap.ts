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
    anchor('counter', 'Patisserie counter', { x: 410, y: 440 }, { x: 410, y: 565 }),
    anchor('npc-work', 'Bakery work position', { x: 750, y: 420 }, { x: 750, y: 545 }),
    anchor('primary-feature', 'Recipe board', { x: 175, y: 720 }, { x: 305, y: 720 }),
    anchor('secondary-feature', 'Wobbly Cake showcase', { x: 750, y: 690 }, { x: 750, y: 835 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    { id: 'counter', x: 410, y: 462, width: 390, height: 86 },
    { id: 'bread-counter', x: 1090, y: 462, width: 390, height: 86 },
    { id: 'recipe-shelf', x: 175, y: 720, width: 92, height: 180 },
    { id: 'cake-table', x: 750, y: 715, width: 290, height: 135 },
    { id: 'cupcake-display', x: 420, y: 660, width: 135, height: 125 },
    { id: 'doughnut-display', x: 1080, y: 660, width: 135, height: 125 },
    { id: 'cafe-table', x: 1210, y: 845, width: 170, height: 110 },
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
    anchor('counter', 'Stylist counter', { x: 1080, y: 390 }, { x: 1080, y: 520 }),
    anchor('npc-work', 'Velvet work position', { x: 760, y: 540 }, { x: 760, y: 650 }),
    anchor('primary-feature', 'Accessory gallery', { x: 485, y: 635 }, { x: 485, y: 770 }),
    anchor('secondary-feature', 'Dressing mirror', { x: 1190, y: 690 }, { x: 1080, y: 790 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    { id: 'counter', x: 1080, y: 410, width: 390, height: 86 },
    { id: 'wall-rack', x: 280, y: 515, width: 150, height: 250 },
    { id: 'display-left', x: 500, y: 650, width: 190, height: 92 },
    { id: 'display-right', x: 830, y: 715, width: 205, height: 92 },
    { id: 'mirror', x: 1190, y: 700, width: 110, height: 125 },
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
    anchor('counter', 'Storykeeper desk', { x: 660, y: 565 }, { x: 660, y: 700 }),
    anchor('npc-work', 'Quill storykeeper position', { x: 660, y: 665 }, { x: 660, y: 785 }),
    anchor('primary-feature', 'Story corner table', { x: 1110, y: 705 }, { x: 960, y: 805 }),
    anchor('secondary-feature', 'Valley clue cabinet', { x: 205, y: 705 }, { x: 360, y: 705 }),
  ),
  colliders: [
    ...ROOM_COLLIDERS,
    // Four flush sections create one continuous back-wall library. The third section is
    // deliberately isolated in collision so a later quest can slide it aside as a secret passage.
    { id: 'bookcase-west', x: 285, y: 425, width: 310, height: 130 },
    { id: 'bookcase-mid-west', x: 595, y: 425, width: 310, height: 130 },
    { id: 'secret-passage-bookcase', x: 905, y: 425, width: 310, height: 130 },
    { id: 'bookcase-east', x: 1215, y: 425, width: 310, height: 130 },
    { id: 'counter', x: 660, y: 590, width: 300, height: 100 },
    { id: 'clue-cabinet', x: 205, y: 705, width: 130, height: 220 },
    { id: 'story-table', x: 1110, y: 715, width: 330, height: 125 },
    { id: 'reading-chair', x: 390, y: 835, width: 165, height: 130 },
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
