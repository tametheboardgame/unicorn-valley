import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';
import {
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from './CottageSemanticAnchors';

export const COTTAGE_INTERIOR_LOCATION_ID = 'location:moonflower-cottage-interior';

export type CottageDecorationCategory = 'wall' | 'floor' | 'table' | 'shelf' | 'display';

export interface CottageDecorationSlot {
  id: string;
  label: string;
  category: CottageDecorationCategory;
  position: MapPoint;
  interactionPosition?: MapPoint;
}

export interface CottageInteractionPoint {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export interface CottageRectLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CottageRoomShell {
  left: number;
  right: number;
  top: number;
  bottom: number;
  backWallBottom: number;
}

export interface CottageReservedZone extends CottageRectLayout {
  id: string;
  purpose: 'future-story' | 'future-portal';
}

/**
 * Canonical H2.1 shell dimensions. The room is intentionally more compact than the
 * prototype so a 112×92 production unicorn reads at home scale rather than in a hall.
 */
export const COTTAGE_ROOM_SHELL = {
  left: 80,
  right: 1420,
  top: 70,
  bottom: 1000,
  backWallBottom: 370,
} as const satisfies CottageRoomShell;

/**
 * Permanent-furniture geometry is shared by presentation and collision. H2.2 may redraw
 * these objects, but it should continue to treat these positions as the H2 room plan
 * unless a later human-approved layout change explicitly replaces them.
 */
export const COTTAGE_FURNITURE_LAYOUT = {
  fireplace: { x: 270, y: 335, width: 240, height: 150 },
  bed: { x: 315, y: 700, width: 300, height: 230 },
  teaTable: { x: 760, y: 555, width: 220, height: 155 },
  sofa: { x: 1075, y: 735, width: 300, height: 145 },
  treasureShelf: { x: 1280, y: 350, width: 210, height: 95 },
  wonderbook: { x: 1260, y: 870, width: 110, height: 105 },
  door: { x: 750, y: 955, width: 185, height: 180 },
} as const satisfies Record<string, CottageRectLayout>;

export const COTTAGE_WINDOW_LAYOUT = [
  { x: 650, y: 200, width: 200, height: 120 },
  { x: 1015, y: 200, width: 200, height: 120 },
] as const satisfies readonly CottageRectLayout[];

/** Protected floor/wall capacity that ordinary permanent furniture must not consume. */
export const COTTAGE_RESERVED_ZONES = [
  { id: 'future-story-1', purpose: 'future-story', x: 560, y: 895, width: 120, height: 120 },
  { id: 'future-story-2', purpose: 'future-story', x: 930, y: 895, width: 120, height: 120 },
  { id: 'future-story-3', purpose: 'future-story', x: 1090, y: 875, width: 120, height: 120 },
  { id: 'future-story-4', purpose: 'future-story', x: 1030, y: 455, width: 120, height: 120 },
  { id: 'future-story-5', purpose: 'future-story', x: 500, y: 455, width: 120, height: 120 },
  { id: 'portal-bay', purpose: 'future-portal', x: 1280, y: 530, width: 200, height: 190 },
] as const satisfies readonly CottageReservedZone[];

const doorAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.door);
const wonderbookAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook);

export const COTTAGE_INTERIOR_MAP = {
  width: 1500,
  height: 1080,
  margin: 64,
  playerSpawn: { x: 750, y: 700 },
  roomShell: COTTAGE_ROOM_SHELL,
  furnitureLayout: COTTAGE_FURNITURE_LAYOUT,
  windowLayout: COTTAGE_WINDOW_LAYOUT,
  reservedZones: COTTAGE_RESERVED_ZONES,
  colliders: [
    // The wall/floor seam is the physical top edge of the walkable room. Furniture
    // against that wall may extend visually into the floor and receives its own blocker.
    {
      id: 'wall-top',
      x: 750,
      y: 220,
      width: COTTAGE_ROOM_SHELL.right - COTTAGE_ROOM_SHELL.left,
      height: COTTAGE_ROOM_SHELL.backWallBottom - COTTAGE_ROOM_SHELL.top,
    },
    {
      id: 'wall-left',
      x: COTTAGE_ROOM_SHELL.left,
      y: 535,
      width: 64,
      height: COTTAGE_ROOM_SHELL.bottom - COTTAGE_ROOM_SHELL.top,
    },
    {
      id: 'wall-right',
      x: COTTAGE_ROOM_SHELL.right,
      y: 535,
      width: 64,
      height: COTTAGE_ROOM_SHELL.bottom - COTTAGE_ROOM_SHELL.top,
    },
    {
      id: 'wall-bottom',
      x: 750,
      y: 1032,
      width: COTTAGE_ROOM_SHELL.right - COTTAGE_ROOM_SHELL.left,
      height: 64,
    },
    { id: 'fireplace', ...COTTAGE_FURNITURE_LAYOUT.fireplace },
    { id: 'bed', ...COTTAGE_FURNITURE_LAYOUT.bed },
    { id: 'tea-table', ...COTTAGE_FURNITURE_LAYOUT.teaTable },
    { id: 'sofa', ...COTTAGE_FURNITURE_LAYOUT.sofa },
    { id: 'treasure-shelf', ...COTTAGE_FURNITURE_LAYOUT.treasureShelf },
    { id: 'wonderbook-lectern', ...COTTAGE_FURNITURE_LAYOUT.wonderbook },
  ] satisfies readonly CollisionRectangle[],
  exit: {
    id: 'cottage-exit',
    label: 'Moonflower Glade',
    position: doorAnchor.position,
    approach: doorAnchor.interactionPosition ?? doorAnchor.position,
  },
  treasureDisplay: {
    id: 'treasure-display',
    label: 'Treasure Shelf',
    position: {
      x: COTTAGE_FURNITURE_LAYOUT.treasureShelf.x,
      y: COTTAGE_FURNITURE_LAYOUT.treasureShelf.y,
    },
    approach: { x: 1120, y: 455 },
  },
  wonderbookDisplay: {
    id: 'wonderbook-display',
    label: 'Wonderbook',
    position: wonderbookAnchor.position,
    approach: wonderbookAnchor.interactionPosition ?? wonderbookAnchor.position,
  },
  decorationSlots: [
    {
      id: 'cottage-slot:window-nook',
      label: 'Window nook',
      category: 'table',
      position: { x: 650, y: 315 },
      interactionPosition: { x: 650, y: 445 },
    },
    {
      id: 'cottage-slot:centre-rug',
      label: 'Centre rug',
      category: 'floor',
      position: { x: 750, y: 790 },
    },
    {
      id: 'cottage-slot:cosy-corner',
      label: 'Cosy corner',
      category: 'floor',
      position: { x: 1040, y: 835 },
    },
    {
      id: 'cottage-slot:bedside',
      label: 'Bedside table',
      category: 'table',
      position: { x: 520, y: 710 },
    },
    {
      id: 'cottage-slot:left-wall',
      label: 'Left wall',
      category: 'wall',
      position: { x: 470, y: 275 },
      interactionPosition: { x: 470, y: 430 },
    },
    {
      id: 'cottage-slot:right-wall',
      label: 'Right wall',
      category: 'wall',
      position: { x: 1120, y: 275 },
      interactionPosition: { x: 1120, y: 430 },
    },
    {
      id: 'cottage-slot:tea-table',
      label: 'Tea table',
      category: 'table',
      position: { x: 760, y: 520 },
      interactionPosition: { x: 760, y: 685 },
    },
    {
      id: 'cottage-slot:treasure-shelf',
      label: 'Treasure shelf',
      category: 'shelf',
      position: { x: 1280, y: 340 },
      interactionPosition: { x: 1280, y: 470 },
    },
    {
      id: 'cottage-slot:ribbon-display',
      label: 'Fireplace display',
      category: 'display',
      position: { x: 270, y: 225 },
      interactionPosition: { x: 420, y: 435 },
    },
  ] satisfies readonly CottageDecorationSlot[],
} satisfies TraversalMapDefinition & {
  roomShell: CottageRoomShell;
  furnitureLayout: typeof COTTAGE_FURNITURE_LAYOUT;
  windowLayout: typeof COTTAGE_WINDOW_LAYOUT;
  reservedZones: readonly CottageReservedZone[];
  exit: CottageInteractionPoint;
  treasureDisplay: CottageInteractionPoint;
  wonderbookDisplay: CottageInteractionPoint;
  decorationSlots: readonly CottageDecorationSlot[];
};
