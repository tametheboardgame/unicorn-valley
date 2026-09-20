import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';
import {
  COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS,
  COTTAGE_FUTURE_EXPANSION_ANCHOR_IDS,
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  type CottageSemanticAnchorId,
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
  anchorId: CottageSemanticAnchorId;
  purpose: 'story' | 'future-story' | 'future-portal';
}

export interface CottageSleepLayout {
  trigger: MapPoint;
  wake: MapPoint;
}

export type CottageFurnitureDepthId =
  | 'fireplace'
  | 'bed'
  | 'tea-table'
  | 'tea-chair-left'
  | 'tea-chair-right'
  | 'sofa'
  | 'treasure-shelf'
  | 'wonderbook'
  | 'exit';

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

/** Permanent-furniture presentation bounds approved through H2.2/H2.3. */
export const COTTAGE_FURNITURE_LAYOUT = {
  fireplace: { x: 270, y: 335, width: 240, height: 150 },
  bed: { x: 315, y: 700, width: 300, height: 230 },
  teaTable: { x: 760, y: 555, width: 220, height: 155 },
  sofa: { x: 1075, y: 735, width: 300, height: 145 },
  treasureShelf: { x: 1280, y: 350, width: 210, height: 95 },
  wonderbook: { x: 1260, y: 870, width: 110, height: 105 },
  door: { x: 750, y: 955, width: 185, height: 180 },
} as const satisfies Record<string, CottageRectLayout>;

const sleepAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.sleep);

/**
 * H2.4 bed geometry. The side rails and headboard stay solid, while the foot remains open so the
 * unicorn can walk naturally into the bed and reach the semantic centre trigger.
 */
export const COTTAGE_SLEEP_LAYOUT = {
  trigger: sleepAnchor.position,
  wake: { x: COTTAGE_FURNITURE_LAYOUT.bed.x, y: 850 },
} as const satisfies CottageSleepLayout;

/**
 * H2.3/H2.4 physical footprints. These describe floor occupancy rather than full visual
 * silhouettes. The bed is now a U-shaped set of blockers: two whole-unicorn-safe side rails plus
 * the headboard, deliberately leaving the foot open for H2.4 sleep entry.
 */
export const COTTAGE_FURNITURE_COLLIDERS = [
  { id: 'fireplace-front', x: 270, y: 394, width: 252, height: 48 },
  { id: 'bed-headboard', x: 315, y: 623, width: 286, height: 52 },
  { id: 'bed-left-rail', x: 197, y: 708, width: 50, height: 170 },
  { id: 'bed-right-rail', x: 433, y: 708, width: 50, height: 170 },
  { id: 'tea-table', x: 760, y: 577, width: 178, height: 96 },
  { id: 'tea-chair-left', x: 637, y: 575, width: 60, height: 76 },
  { id: 'tea-chair-right', x: 883, y: 575, width: 60, height: 76 },
  { id: 'sofa-base', x: 1075, y: 744, width: 246, height: 115 },
  { id: 'treasure-shelf-front', x: 1280, y: 390, width: 212, height: 40 },
  { id: 'wonderbook-lectern', x: 1260, y: 910, width: 82, height: 64 },
  { id: 'exit-left-post', x: 638, y: 986, width: 22, height: 46 },
  { id: 'exit-right-post', x: 862, y: 986, width: 22, height: 46 },
] as const satisfies readonly CollisionRectangle[];

/** Sort lines for permanent furnishings. Bed foreground/rear split is rendered in H2.4. */
export const COTTAGE_FURNITURE_DEPTH_ANCHORS = {
  fireplace: 420,
  bed: 810,
  'tea-table': 640,
  'tea-chair-left': 615,
  'tea-chair-right': 615,
  sofa: 805,
  'treasure-shelf': 410,
  wonderbook: 942,
  exit: 1005,
} as const satisfies Record<CottageFurnitureDepthId, number>;

export const COTTAGE_WINDOW_LAYOUT = [
  { x: 650, y: 200, width: 200, height: 120 },
  { x: 1015, y: 200, width: 200, height: 120 },
] as const satisfies readonly CottageRectLayout[];

function reservedZoneForAnchor(anchorId: CottageSemanticAnchorId): CottageReservedZone {
  const anchor = resolveCottageSemanticAnchor(anchorId);
  if (!anchor.reservation) {
    throw new Error(`Cottage protected anchor is missing a reservation: ${anchorId}`);
  }
  if (
    anchor.purpose !== 'story' &&
    anchor.purpose !== 'future-story' &&
    anchor.purpose !== 'future-portal'
  ) {
    throw new Error(`Cottage protected anchor has unsupported purpose: ${anchorId}`);
  }

  return {
    id: `reserved:${anchor.id}`,
    anchorId: anchor.id,
    purpose: anchor.purpose,
    x: anchor.position.x,
    y: anchor.position.y,
    width: anchor.reservation.width,
    height: anchor.reservation.height,
  };
}

/**
 * Story and future-expansion capacity is derived from the semantic-anchor registry rather than
 * duplicated raw coordinates. Ordinary decorating must remain outside these reservations.
 */
export const COTTAGE_RESERVED_ZONES = COTTAGE_FUTURE_EXPANSION_ANCHOR_IDS.map(
  reservedZoneForAnchor,
) satisfies readonly CottageReservedZone[];

export const COTTAGE_DECORATION_PROTECTED_ZONES = COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS.map(
  reservedZoneForAnchor,
) satisfies readonly CottageReservedZone[];

function findContainingReservedZone(
  zones: readonly CottageReservedZone[],
  point: MapPoint,
  clearance: number,
): CottageReservedZone | null {
  return (
    zones.find(
      (zone) =>
        Math.abs(point.x - zone.x) <= zone.width / 2 + clearance &&
        Math.abs(point.y - zone.y) <= zone.height / 2 + clearance,
    ) ?? null
  );
}

export function isCottagePointInsideReservedZone(
  point: MapPoint,
  clearance = 0,
): CottageReservedZone | null {
  return findContainingReservedZone(COTTAGE_RESERVED_ZONES, point, clearance);
}

export function isCottagePointInsideDecorationProtectedZone(
  point: MapPoint,
  clearance = 0,
): CottageReservedZone | null {
  return findContainingReservedZone(COTTAGE_DECORATION_PROTECTED_ZONES, point, clearance);
}

/**
 * Retired from normal H2.4 play because the bed now owns this physical area. Keep the authored
 * slot data available for H2.5 Decorate mode without leaving a competing interaction hotspot.
 */
export const COTTAGE_DEFERRED_DECORATION_SLOTS = [
  {
    id: 'cottage-slot:bedside',
    label: 'Bedside table',
    category: 'table',
    position: { x: 520, y: 710 },
  },
] as const satisfies readonly CottageDecorationSlot[];

const doorAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.door);
const wonderbookAnchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook);
const exitCollisionGapWidth = COTTAGE_FURNITURE_LAYOUT.door.width + 40;
const bottomWallSegmentWidth =
  (COTTAGE_ROOM_SHELL.right - COTTAGE_ROOM_SHELL.left - exitCollisionGapWidth) / 2;
const bottomWallLeftCentre = COTTAGE_ROOM_SHELL.left + bottomWallSegmentWidth / 2;
const bottomWallRightCentre = COTTAGE_ROOM_SHELL.right - bottomWallSegmentWidth / 2;
const bottomWallCollisionHeight = 64;
const bottomWallCollisionTop = COTTAGE_ROOM_SHELL.bottom - 24;
const bottomWallCollisionCentre = bottomWallCollisionTop + bottomWallCollisionHeight / 2;

export const COTTAGE_INTERIOR_MAP = {
  width: 1500,
  height: 1080,
  margin: 64,
  playerSpawn: { x: 750, y: 700 },
  roomShell: COTTAGE_ROOM_SHELL,
  furnitureLayout: COTTAGE_FURNITURE_LAYOUT,
  furnitureDepthAnchors: COTTAGE_FURNITURE_DEPTH_ANCHORS,
  sleepLayout: COTTAGE_SLEEP_LAYOUT,
  windowLayout: COTTAGE_WINDOW_LAYOUT,
  reservedZones: COTTAGE_RESERVED_ZONES,
  deferredDecorationSlots: COTTAGE_DEFERRED_DECORATION_SLOTS,
  colliders: [
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
      id: 'wall-bottom-left',
      x: bottomWallLeftCentre,
      y: bottomWallCollisionCentre,
      width: bottomWallSegmentWidth,
      height: bottomWallCollisionHeight,
    },
    {
      id: 'wall-bottom-right',
      x: bottomWallRightCentre,
      y: bottomWallCollisionCentre,
      width: bottomWallSegmentWidth,
      height: bottomWallCollisionHeight,
    },
    ...COTTAGE_FURNITURE_COLLIDERS,
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
  furnitureDepthAnchors: typeof COTTAGE_FURNITURE_DEPTH_ANCHORS;
  sleepLayout: CottageSleepLayout;
  windowLayout: typeof COTTAGE_WINDOW_LAYOUT;
  reservedZones: readonly CottageReservedZone[];
  deferredDecorationSlots: readonly CottageDecorationSlot[];
  exit: CottageInteractionPoint;
  treasureDisplay: CottageInteractionPoint;
  wonderbookDisplay: CottageInteractionPoint;
  decorationSlots: readonly CottageDecorationSlot[];
};
