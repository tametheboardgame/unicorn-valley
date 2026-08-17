import type { CollisionRectangle, MapPoint, TraversalMapDefinition } from './MapTraversal';

export const COTTAGE_INTERIOR_LOCATION_ID = 'location:moonflower-cottage-interior';

export interface CottageDecorationSlot {
  id: string;
  label: string;
  position: MapPoint;
}

export interface CottageInteractionPoint {
  id: string;
  label: string;
  position: MapPoint;
  approach: MapPoint;
}

export const COTTAGE_INTERIOR_MAP = {
  width: 1800,
  height: 1200,
  margin: 70,
  playerSpawn: { x: 900, y: 1005 },
  colliders: [
    { id: 'fireplace', x: 285, y: 305, width: 250, height: 150 },
    { id: 'bed', x: 390, y: 670, width: 300, height: 230 },
    { id: 'tea-table', x: 900, y: 500, width: 230, height: 165 },
    { id: 'sofa', x: 1245, y: 735, width: 300, height: 145 },
    { id: 'treasure-shelf', x: 1515, y: 345, width: 220, height: 95 },
  ] satisfies readonly CollisionRectangle[],
  exit: {
    id: 'cottage-exit',
    label: 'Moonflower Glade',
    position: { x: 900, y: 1110 },
    approach: { x: 900, y: 1010 },
  },
  treasureDisplay: {
    id: 'treasure-display',
    label: 'Treasure Shelf',
    position: { x: 1515, y: 345 },
    approach: { x: 1310, y: 390 },
  },
  decorationSlots: [
    { id: 'cottage-slot:window-nook', label: 'Window nook', position: { x: 705, y: 320 } },
    { id: 'cottage-slot:centre-rug', label: 'Centre rug', position: { x: 900, y: 790 } },
    { id: 'cottage-slot:cosy-corner', label: 'Cosy corner', position: { x: 1450, y: 735 } },
    { id: 'cottage-slot:bedside', label: 'Bedside', position: { x: 610, y: 720 } },
  ] satisfies readonly CottageDecorationSlot[],
} satisfies TraversalMapDefinition & {
  exit: CottageInteractionPoint;
  treasureDisplay: CottageInteractionPoint;
  decorationSlots: readonly CottageDecorationSlot[];
};
